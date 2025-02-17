import pytest
from app.models.language import Language
from app.models.language_pair import LanguagePair

def test_create_language_pair(db, sample_language):
    target_language = Language(code="de", name="German")
    db.add(target_language)
    db.commit()
    
    pair = LanguagePair(
        source_language_id=sample_language.id,
        target_language_id=target_language.id
    )
    db.add(pair)
    db.commit()
    
    assert pair.id is not None
    assert pair.source_language_id == sample_language.id
    assert pair.target_language_id == target_language.id

def test_get_language_pair(db, sample_language_pair):
    pair = db.query(LanguagePair).filter(LanguagePair.id == sample_language_pair.id).first()
    assert pair.source_language.code == "en"
    assert pair.target_language.code == "es"  # Changed from "de" to match fixture