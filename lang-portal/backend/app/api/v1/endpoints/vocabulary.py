from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload, contains_eager
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.db.database import get_db
from app.models.vocabulary import Vocabulary
from app.models.language_pair import LanguagePair
from app.schemas.vocabulary import (
    VocabularyCreate,
    VocabularyRead,
    VocabularyUpdate,
    VocabularyListResponse,
    VocabularyError,
    DuplicateVocabularyError
)
import math
from datetime import datetime, UTC

router = APIRouter()

@router.get("/", response_model=VocabularyListResponse)
def list_vocabularies(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = None,
    language_pair_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Calculate skip
    skip = (page - 1) * size
    
    # Build base query with joins for better performance
    query = db.query(Vocabulary).join(
        Vocabulary.language_pair
    ).options(
        # Add eager loading to avoid N+1 queries
        db.contains_eager(Vocabulary.language_pair)
    )
    
    # Apply filters
    if language_pair_id:
        query = query.filter(Vocabulary.language_pair_id == language_pair_id)
        # Verify language pair exists
        if not db.query(LanguagePair.id).filter(LanguagePair.id == language_pair_id).first():
            raise HTTPException(
                status_code=404,
                detail=VocabularyError(
                    detail="Language pair not found",
                    code="language_pair_not_found"
                ).model_dump()
            )
    
    if search:
        search = search.strip().lower()
        query = query.filter(
            or_(
                Vocabulary.word.ilike(f"%{search}%"),
                Vocabulary.translation.ilike(f"%{search}%")
            )
        )
    
    # Get total count for pagination
    total = query.count()
    
    # Get paginated results
    items = query.offset(skip).limit(size).all()
    
    return VocabularyListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size)
    )

@router.post("/", response_model=VocabularyRead)
def create_vocabulary(vocabulary: VocabularyCreate, db: Session = Depends(get_db)):
    # Check if language pair exists using a more efficient query
    if not db.query(LanguagePair.id).filter(LanguagePair.id == vocabulary.language_pair_id).first():
        raise HTTPException(
            status_code=404,
            detail=VocabularyError(
                detail="Language pair not found",
                code="language_pair_not_found"
            ).model_dump()
        )
    
    # Check for existing vocabulary with same word in the same language pair
    if db.query(Vocabulary.id).filter(
        Vocabulary.word == vocabulary.word,
        Vocabulary.language_pair_id == vocabulary.language_pair_id
    ).first():
        raise HTTPException(
            status_code=400,
            detail=DuplicateVocabularyError(
                detail="Vocabulary with this word already exists for this language pair",
                word=vocabulary.word,
                language_pair_id=vocabulary.language_pair_id
            ).model_dump()
        )
    
    try:
        db_vocabulary = Vocabulary(**vocabulary.model_dump())
        db.add(db_vocabulary)
        db.commit()
        db.refresh(db_vocabulary)
        return db_vocabulary
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=VocabularyError(
                detail="Invalid data provided",
                code="invalid_data"
            ).model_dump()
        )

@router.post("/bulk", response_model=List[VocabularyRead])
def create_vocabularies_bulk(
    vocabularies: List[VocabularyCreate],
    db: Session = Depends(get_db)
):
    if not vocabularies:
        raise HTTPException(
            status_code=400,
            detail={"code": "empty_list", "message": "No vocabularies provided"}
        )
    
    # Check for duplicates
    words = [(v.word, v.language_pair_id) for v in vocabularies]
    if len(set(words)) != len(words):
        raise HTTPException(
            status_code=400,
            detail={"code": "duplicate_vocabularies", "message": "Duplicate words found"}
        )
    
    try:
        created_vocabularies = []
        for vocab_data in vocabularies:
            vocabulary = Vocabulary(**vocab_data.dict())
            db.add(vocabulary)
            created_vocabularies.append(vocabulary)
        db.commit()
        
        for vocab in created_vocabularies:
            db.refresh(vocab)
        
        return created_vocabularies
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail={"code": "creation_failed", "message": str(e)}
        )

@router.get("/{vocabulary_id}", response_model=VocabularyRead)
def get_vocabulary(
    vocabulary_id: int,
    db: Session = Depends(get_db)
):
    vocabulary = db.query(Vocabulary).options(
        joinedload(Vocabulary.language_pair)
    ).filter(
        Vocabulary.id == vocabulary_id
    ).first()
    
    if not vocabulary:
        raise HTTPException(
            status_code=404,
            detail={"code": "vocabulary_not_found", "message": "Vocabulary not found"}
        )
    return vocabulary

@router.put("/{vocabulary_id}", response_model=VocabularyRead)
def update_vocabulary(
    vocabulary_id: int,
    vocabulary_update: VocabularyUpdate,
    db: Session = Depends(get_db)
):
    vocabulary = db.query(Vocabulary).options(
        joinedload(Vocabulary.language_pair)
    ).filter(
        Vocabulary.id == vocabulary_id
    ).first()
    
    if not vocabulary:
        raise HTTPException(
            status_code=404,
            detail={"code": "vocabulary_not_found", "message": "Vocabulary not found"}
        )
    
    # Update fields
    for field, value in vocabulary_update.dict(exclude_unset=True).items():
        setattr(vocabulary, field, value)
    
    try:
        db.commit()
        db.refresh(vocabulary)
        return vocabulary
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail={"code": "update_failed", "message": str(e)}
        )

@router.delete("/{vocabulary_id}")
def delete_vocabulary(vocabulary_id: int, db: Session = Depends(get_db)):
    vocabulary = db.query(Vocabulary).get(vocabulary_id)
    if not vocabulary:
        raise HTTPException(
            status_code=404,
            detail={"code": "vocabulary_not_found", "message": "Vocabulary not found"}
        )
    
    try:
        db.delete(vocabulary)
        db.commit()
        return {"code": "success", "message": "Vocabulary deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"code": "delete_failed", "message": str(e)}
        )

@router.delete("/bulk", status_code=204)
def delete_vocabularies_bulk(
    vocabulary_ids: List[int],
    db: Session = Depends(get_db)
):
    if not vocabulary_ids:
        raise HTTPException(
            status_code=400,
            detail={"code": "empty_list", "message": "No vocabulary IDs provided"}
        )
    
    # Check if all vocabularies exist
    existing_ids = db.query(Vocabulary.id).filter(
        Vocabulary.id.in_(vocabulary_ids)
    ).all()
    existing_ids = [id[0] for id in existing_ids]
    
    if len(existing_ids) != len(vocabulary_ids):
        raise HTTPException(
            status_code=404,
            detail={"code": "vocabularies_not_found", "message": "Some vocabularies not found"}
        )
    
    try:
        db.query(Vocabulary).filter(
            Vocabulary.id.in_(vocabulary_ids)
        ).delete(synchronize_session=False)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"code": "delete_failed", "message": str(e)}
        )