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
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=VocabularyError(
                detail="No vocabularies provided",
                code="empty_vocabulary_list"
            ).model_dump()
        )

    # Validate all language pairs first using a single query
    language_pair_ids = {v.language_pair_id for v in vocabularies}
    existing_pairs = set(p[0] for p in db.query(LanguagePair.id).filter(
        LanguagePair.id.in_(language_pair_ids)
    ).all())
    
    missing_pairs = language_pair_ids - existing_pairs
    if missing_pairs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=VocabularyError(
                detail=f"Language pairs not found: {missing_pairs}",
                code="language_pairs_not_found"
            ).model_dump()
        )
    
    # Check for duplicates using a single query
    word_pairs = [(v.word, v.language_pair_id) for v in vocabularies]
    existing = db.query(Vocabulary.word, Vocabulary.language_pair_id).filter(
        or_(
            *(
                (Vocabulary.word == word) & 
                (Vocabulary.language_pair_id == pair_id)
                for word, pair_id in word_pairs
            )
        )
    ).all()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=VocabularyError(
                detail=f"Duplicate vocabularies found: {existing}",
                code="duplicate_vocabularies"
            ).model_dump()
        )
    
    try:
        # Create all vocabularies in a single transaction
        db_vocabularies = [
            Vocabulary(**v.model_dump())
            for v in vocabularies
        ]
        db.add_all(db_vocabularies)
        db.commit()
        
        # Refresh all instances in a single query
        vocab_ids = [v.id for v in db_vocabularies]
        return db.query(Vocabulary).filter(Vocabulary.id.in_(vocab_ids)).all()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=VocabularyError(
                detail="Invalid data provided",
                code="invalid_data"
            ).model_dump()
        )

@router.get("/{vocabulary_id}", response_model=VocabularyRead)
def get_vocabulary(vocabulary_id: int, db: Session = Depends(get_db)):
    vocabulary = db.query(Vocabulary).options(
        db.joinedload(Vocabulary.language_pair)
    ).filter(
        Vocabulary.id == vocabulary_id
    ).first()
    
    if not vocabulary:
        raise HTTPException(
            status_code=404,
            detail=VocabularyError(
                detail="Vocabulary not found",
                code="vocabulary_not_found"
            ).model_dump()
        )
    return vocabulary

@router.put("/{vocabulary_id}", response_model=VocabularyRead)
def update_vocabulary(
    vocabulary_id: int,
    vocabulary_update: VocabularyUpdate,
    db: Session = Depends(get_db)
):
    # Get vocabulary with language pair in a single query
    vocabulary = db.query(Vocabulary).options(
        db.joinedload(Vocabulary.language_pair)
    ).filter(
        Vocabulary.id == vocabulary_id
    ).first()
    
    if not vocabulary:
        raise HTTPException(
            status_code=404,
            detail=VocabularyError(
                detail="Vocabulary not found",
                code="vocabulary_not_found"
            ).model_dump()
        )
    
    # Verify language pair if it's being updated
    if vocabulary_update.language_pair_id and vocabulary_update.language_pair_id != vocabulary.language_pair_id:
        if not db.query(LanguagePair.id).filter(LanguagePair.id == vocabulary_update.language_pair_id).first():
            raise HTTPException(
                status_code=404,
                detail=VocabularyError(
                    detail="Language pair not found",
                    code="language_pair_not_found"
                ).model_dump()
            )
    
    try:
        for field, value in vocabulary_update.model_dump(exclude_unset=True).items():
            setattr(vocabulary, field, value)
        vocabulary.updated_at = datetime.now(UTC)
        db.commit()
        db.refresh(vocabulary)
        return vocabulary
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=DuplicateVocabularyError(
                detail="Vocabulary with this word already exists for this language pair",
                word=vocabulary.word,
                language_pair_id=vocabulary.language_pair_id
            ).model_dump()
        )

@router.delete("/{vocabulary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vocabulary(vocabulary_id: int, db: Session = Depends(get_db)):
    result = db.query(Vocabulary).filter(
        Vocabulary.id == vocabulary_id
    ).delete(synchronize_session=False)
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail=VocabularyError(
                detail="Vocabulary not found",
                code="vocabulary_not_found"
            ).model_dump()
        )
    
    db.commit()
    return None

@router.delete("/bulk", status_code=status.HTTP_204_NO_CONTENT)
def delete_vocabularies_bulk(
    vocabulary_ids: List[int],
    db: Session = Depends(get_db)
):
    if not vocabulary_ids:
        raise HTTPException(
            status_code=400,
            detail=VocabularyError(
                detail="No vocabulary IDs provided",
                code="empty_id_list"
            ).model_dump()
        )
    
    # Delete all vocabularies in one query
    result = db.query(Vocabulary).filter(
        Vocabulary.id.in_(vocabulary_ids)
    ).delete(synchronize_session=False)
    
    if result == 0:
        raise HTTPException(
            status_code=404,
            detail=VocabularyError(
                detail="No vocabularies found with the provided IDs",
                code="vocabularies_not_found"
            ).model_dump()
        )
    
    db.commit()
    return None