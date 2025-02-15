from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.schemas.vocabulary_group import (
    VocabularyGroupCreate,
    VocabularyGroup as VocabularyGroupSchema,
    VocabularyGroupUpdate,
    VocabularyGroupWithVocabularies
)

router = APIRouter()

@router.post("/vocabulary-groups/", response_model=VocabularyGroupSchema)
def create_vocabulary_group(group: VocabularyGroupCreate, db: Session = Depends(get_db)):
    db_group = VocabularyGroup(**group.model_dump())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@router.get("/vocabulary-groups/", response_model=List[VocabularyGroupSchema])
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
    return group

@router.put("/vocabulary-groups/{group_id}", response_model=VocabularyGroupSchema)
def update_vocabulary_group(
    group_id: int,
    group_update: VocabularyGroupUpdate,
    db: Session = Depends(get_db)
):
    db_group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    for key, value in group_update.model_dump(exclude_unset=True).items():
        setattr(db_group, key, value)
    
    db.commit()
    db.refresh(db_group)
    return db_group

@router.post("/vocabulary-groups/{group_id}/vocabularies/{vocab_id}")
def add_vocabulary_to_group(group_id: int, vocab_id: int, db: Session = Depends(get_db)):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    if vocab.language_pair_id != group.language_pair_id:
        raise HTTPException(
            status_code=400,
            detail="Vocabulary and group must belong to the same language pair"
        )
    
    group.vocabularies.append(vocab)
    db.commit()
    return {"status": "success"}

@router.delete("/vocabulary-groups/{group_id}/vocabularies/{vocab_id}")
def remove_vocabulary_from_group(group_id: int, vocab_id: int, db: Session = Depends(get_db)):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    
    group.vocabularies.remove(vocab)
    db.commit()
    return {"status": "success"} 