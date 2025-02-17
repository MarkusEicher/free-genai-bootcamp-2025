import pytest
from app.models.language import Language

def test_create_language(db):
    # Tests creating a new language
    language = Language(code="de", name="German")
    db.add(language)           # Add to database
    db.commit()               # Save changes
    db.refresh(language)      # Refresh from database
    
    # Verify the language was created correctly
    assert language.id is not None    # Should have an ID
    assert language.code == "de"      # Correct code
    assert language.name == "German"  # Correct name

def test_get_language(db, sample_language):
    # Tests reading a language
    # Uses sample_language fixture which creates English
    stored_language = db.query(Language).filter(Language.code == "en").first()
    
    # Verify we can retrieve the language
    assert stored_language is not None
    assert stored_language.name == "English"

def test_update_language(db, sample_language):
    # Tests updating a language
    sample_language.name = "British English"  # Change the name
    db.commit()                              # Save changes
    db.refresh(sample_language)              # Refresh from database
    
    # Verify the update worked
    updated_language = db.query(Language).filter(Language.code == "en").first()
    assert updated_language.name == "British English"

def test_delete_language(db, sample_language):
    # Tests deleting a language
    db.delete(sample_language)    # Delete the language
    db.commit()                   # Save changes
    
    # Verify the language was deleted
    deleted_language = db.query(Language).filter(Language.code == "en").first()
    assert deleted_language is None  # Should not find the language