from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.schemas.language import (
    Language as LanguageSchema,
    LanguageCreate,
    LanguagePair as LanguagePairSchema,
    LanguagePairCreate
)

router = APIRouter()

# Language endpoints
@router.post("/languages/", response_model=LanguageSchema)
def create_language(language: LanguageCreate, db: Session = Depends(get_db)):
    db_language = Language(**language.model_dump())
    db.add(db_language)
    db.commit()
    db.refresh(db_language)
    return db_language

@router.get("/languages/", response_model=List[LanguageSchema])
def list_languages(db: Session = Depends(get_db)):
    return db.query(Language).all()

@router.get("/languages/{language_id}", response_model=LanguageSchema)
def get_language(language_id: int, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language

# Language pair endpoints
@router.post("/language-pairs/", response_model=LanguagePairSchema)
def create_language_pair(pair: LanguagePairCreate, db: Session = Depends(get_db)):
    if pair.source_language_id == pair.target_language_id:
        raise HTTPException(status_code=400, detail="Source and target languages must be different")
    
    # Check if languages exist
    source = db.query(Language).filter(Language.id == pair.source_language_id).first()
    target = db.query(Language).filter(Language.id == pair.target_language_id).first()
    
    if not source or not target:
        raise HTTPException(status_code=404, detail="One or both languages not found")
    
    db_pair = LanguagePair(**pair.model_dump())
    db.add(db_pair)
    db.commit()
    db.refresh(db_pair)
    return db_pair

@router.get("/language-pairs/", response_model=List[LanguagePairSchema])
def list_language_pairs(db: Session = Depends(get_db)):
    return db.query(LanguagePair).all()

@router.get("/language-pairs/{pair_id}", response_model=LanguagePairSchema)
def get_language_pair(pair_id: int, db: Session = Depends(get_db)):
    pair = db.query(LanguagePair).filter(LanguagePair.id == pair_id).first()
    if not pair:
        raise HTTPException(status_code=404, detail="Language pair not found")
    return pair 