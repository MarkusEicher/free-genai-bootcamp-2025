from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.schemas.vocabulary_group import (
    VocabularyGroupCreate,
    VocabularyGroupUpdate,
    VocabularyGroupWithVocabularies,
    VocabularyGroupRead
)
from app.models.language_pair import LanguagePair
from app.schemas.statistics import VocabularyGroupStatistics
from app.models.progress import VocabularyProgress

router = APIRouter()

@router.post("/vocabulary-groups/", response_model=VocabularyGroupRead)
def create_vocabulary_group(group: VocabularyGroupCreate, db: Session = Depends(get_db)):
    # Check if language pair exists
    language_pair = db.query(LanguagePair).filter(LanguagePair.id == group.language_pair_id).first()
    if not language_pair:
        raise HTTPException(status_code=404, detail="Language pair not found")
    
    # Check for existing group with same name in the same language pair
    existing = db.query(VocabularyGroup).filter(
        VocabularyGroup.name == group.name,
        VocabularyGroup.language_pair_id == group.language_pair_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Group with this name already exists for this language pair")
    
    db_group = VocabularyGroup(**group.model_dump())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/vocabulary-groups/", response_model=List[VocabularyGroupRead])
def list_vocabulary_groups(
    language_pair_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(VocabularyGroup)
    if language_pair_id:
        query = query.filter(VocabularyGroup.language_pair_id == language_pair_id)
    return query.offset(skip).limit(limit).all()

@router.get("/vocabulary-groups/{group_id}", response_model=VocabularyGroupWithVocabularies)
def get_vocabulary_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    # Calculate additional statistics
    total_vocabularies = len(group.vocabularies)
    mastered_vocabularies = sum(1 for v in group.vocabularies if v.progress and v.progress.mastered)
    
    # Calculate average success rate
    success_rates = []
    for vocab in group.vocabularies:
        if vocab.progress:
            total = vocab.progress.correct_attempts + vocab.progress.incorrect_attempts
            if total > 0:
                success_rates.append((vocab.progress.correct_attempts / total) * 100)
    
    average_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0.0
    
    return VocabularyGroupWithVocabularies(
        id=group.id,
        name=group.name,
        description=group.description,
        language_pair_id=group.language_pair_id,
        created_at=group.created_at,
        updated_at=group.updated_at,
        vocabularies=group.vocabularies,
        total_vocabularies=total_vocabularies,
        mastered_vocabularies=mastered_vocabularies,
        average_success_rate=average_success_rate
    )

@router.put("/vocabulary-groups/{group_id}", response_model=VocabularyGroupRead)
def update_vocabulary_group(
    group_id: int,
    group_update: VocabularyGroupUpdate,
    db: Session = Depends(get_db)
):
    db_group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    # Verify language pair if it's being updated
    if group_update.language_pair_id:
        language_pair = db.query(LanguagePair).filter(
            LanguagePair.id == group_update.language_pair_id
        ).first()
        if not language_pair:
            raise HTTPException(status_code=404, detail="Language pair not found")
    
    for field, value in group_update.model_dump(exclude_unset=True).items():
        setattr(db_group, field, value)
    
    db.commit()
    db.refresh(db_group)
    return db_group

@router.delete("/vocabulary-groups/{group_id}")
def delete_vocabulary_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    db.delete(group)
    db.commit()
    return {"ok": True}

@router.post("/vocabulary-groups/{group_id}/vocabularies/{vocabulary_id}")
def add_vocabulary_to_group(
    group_id: int,
    vocabulary_id: int,
    db: Session = Depends(get_db)
):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    vocabulary = db.query(Vocabulary).filter(Vocabulary.id == vocabulary_id).first()
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    if vocabulary in group.vocabularies:
        raise HTTPException(status_code=400, detail="Vocabulary already in group")
    
    group.vocabularies.append(vocabulary)
    db.commit()
    return {"ok": True}

@router.delete("/vocabulary-groups/{group_id}/vocabularies/{vocabulary_id}")
def remove_vocabulary_from_group(
    group_id: int,
    vocabulary_id: int,
    db: Session = Depends(get_db)
):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    vocabulary = db.query(Vocabulary).filter(Vocabulary.id == vocabulary_id).first()
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    if vocabulary not in group.vocabularies:
        raise HTTPException(status_code=400, detail="Vocabulary not in group")
    
    group.vocabularies.remove(vocabulary)
    db.commit()
    return {"ok": True}

@router.get("/vocabulary-groups/{group_id}/statistics", response_model=VocabularyGroupStatistics)
def get_vocabulary_group_statistics(
    group_id: int,
    db: Session = Depends(get_db)
) -> VocabularyGroupStatistics:
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")

    # Get all vocabularies in the group
    vocabularies = group.vocabularies
    total_vocabularies = len(vocabularies)
    
    # Get progress for all vocabularies in the group
    vocabulary_ids = [v.id for v in vocabularies]
    progress_records = db.query(VocabularyProgress).filter(
        VocabularyProgress.vocabulary_id.in_(vocabulary_ids)
    ).all()

    # Calculate statistics
    mastered_count = sum(1 for p in progress_records if p.mastered)
    total_success_rate = sum(p.success_rate for p in progress_records) if progress_records else 0
    avg_success_rate = total_success_rate / len(progress_records) if progress_records else 0

    # Get recent activity
    recent_progress = db.query(VocabularyProgress).join(Vocabulary).filter(
        Vocabulary.id.in_(vocabulary_ids)
    ).order_by(VocabularyProgress.last_reviewed.desc()).limit(5).all()

    return VocabularyGroupStatistics(
        group_id=group_id,
        total_vocabularies=total_vocabularies,
        mastered_vocabularies=mastered_count,
        completion_rate=mastered_count / total_vocabularies * 100 if total_vocabularies > 0 else 0,
        average_success_rate=avg_success_rate,
        recent_activity=recent_progress
    )