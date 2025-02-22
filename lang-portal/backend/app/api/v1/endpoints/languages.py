from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.schemas.language import (
    Language as LanguageSchema,
    LanguageCreate,
    LanguagePair as LanguagePairSchema,
    LanguagePairCreate,
    LanguageUpdate
)
from sqlalchemy import or_

router = APIRouter()

# Language endpoints
@router.post("/languages/", response_model=LanguageSchema)
def create_language(language: LanguageCreate, db: Session = Depends(get_db)):
    # Check for existing language with same code
    existing = db.query(Language).filter(Language.code == language.code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Language with this code already exists"
        )
    
    db_language = Language(**language.model_dump())
    db.add(db_language)
    db.commit()
    db.refresh(db_language)
    return db_language

@router.get("/languages/", response_model=List[LanguageSchema])
def list_languages(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1),
    db: Session = Depends(get_db)
):
    languages = db.query(Language).offset(skip).limit(limit).all()
    return languages

@router.get("/languages/{language_id}", response_model=LanguageSchema)
def get_language(language_id: int, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language

@router.put("/languages/{language_id}", response_model=LanguageSchema)
def update_language(
    language_id: int,
    language_update: LanguageUpdate,
    db: Session = Depends(get_db)
):
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    for field, value in language_update.model_dump(exclude_unset=True).items():
        setattr(language, field, value)
    
    db.commit()
    db.refresh(language)
    return language

@router.delete("/languages/{language_id}")
def delete_language(language_id: int, db: Session = Depends(get_db)):
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    db.delete(language)
    db.commit()
    return {"ok": True}

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
    
    # Check for existing pair
    existing = db.query(LanguagePair).filter(
        LanguagePair.source_language_id == pair.source_language_id,
        LanguagePair.target_language_id == pair.target_language_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Language pair already exists")
    
    db_pair = LanguagePair(**pair.model_dump())
    db.add(db_pair)
    db.commit()
    db.refresh(db_pair)
    return db_pair

@router.get("/language-pairs/", response_model=List[LanguagePairSchema])
def list_language_pairs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1),
    db: Session = Depends(get_db)
):
    return db.query(LanguagePair).offset(skip).limit(limit).all()

@router.get("/language-pairs/{pair_id}", response_model=LanguagePairSchema)
def get_language_pair(pair_id: int, db: Session = Depends(get_db)):
    pair = db.query(LanguagePair).filter(LanguagePair.id == pair_id).first()
    if not pair:
        raise HTTPException(status_code=404, detail="Language pair not found")
    return pair

@router.delete("/language-pairs/{pair_id}")
def delete_language_pair(pair_id: int, db: Session = Depends(get_db)):
    pair = db.query(LanguagePair).filter(LanguagePair.id == pair_id).first()
    if not pair:
        raise HTTPException(
            status_code=404,
            detail={"msg": "Language pair not found"}
        )
    
    db.delete(pair)
    db.commit()
    return {"ok": True}

@router.get("/language-pairs/by-language/{language_id}", response_model=List[LanguagePairSchema])
def list_language_pairs_by_language(
    language_id: int,
    as_source: bool = Query(True),
    as_target: bool = Query(True),
    db: Session = Depends(get_db)
):
    language = db.query(Language).filter(Language.id == language_id).first()
    if not language:
        raise HTTPException(
            status_code=404,
            detail={"msg": "Language not found"}
        )
    
    query = db.query(LanguagePair)
    if as_source and as_target:
        query = query.filter(
            or_(
                LanguagePair.source_language_id == language_id,
                LanguagePair.target_language_id == language_id
            )
        )
    elif as_source:
        query = query.filter(LanguagePair.source_language_id == language_id)
    elif as_target:
        query = query.filter(LanguagePair.target_language_id == language_id)
    
    return query.all()

@router.get("/")
async def get_languages(db: Session = Depends(get_db)):
    """Get all available languages."""
    # Implementation here
    pass

@router.get("/{language_id}")
async def get_language(language_id: int, db: Session = Depends(get_db)):
    """Get a specific language."""
    # Implementation here
    pass