from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.vocabulary import Vocabulary
from app.schemas.vocabulary import VocabularyCreate, VocabularyRead
from app.models.language_pair import LanguagePair
from app.db.database import get_db

router = APIRouter()

@router.post("/", response_model=VocabularyRead)
def create_vocabulary(
    vocabulary: VocabularyCreate,
    db: Session = Depends(get_db)
) -> VocabularyRead:
    # Check if language pair exists
    language_pair = db.query(LanguagePair).filter(LanguagePair.id == vocabulary.language_pair_id).first()
    if not language_pair:
        raise HTTPException(status_code=404, detail="Language pair not found")

    # Check for duplicate vocabulary
    existing = db.query(Vocabulary).filter(
        Vocabulary.word == vocabulary.word,
        Vocabulary.language_pair_id == vocabulary.language_pair_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vocabulary already exists for this language pair")

    db_vocabulary = Vocabulary(**vocabulary.model_dump())
    db.add(db_vocabulary)
    db.commit()
    db.refresh(db_vocabulary)
    return VocabularyRead.model_validate(db_vocabulary) 