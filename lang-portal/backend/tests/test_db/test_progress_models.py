import pytest
from datetime import datetime
from app.models.progress import VocabularyProgress

def test_create_progress(db, sample_vocabulary):
    progress = VocabularyProgress(
        vocabulary_id=sample_vocabulary.id,
        correct_attempts=3,
        incorrect_attempts=1,
        mastered=False
    )
    db.add(progress)
    db.commit()
    
    assert progress.id is not None
    assert progress.vocabulary_id == sample_vocabulary.id
    assert progress.correct_attempts == 3
    assert progress.incorrect_attempts == 1
    assert progress.mastered is False
    assert progress.created_at is not None

def test_get_progress(db, sample_progress):
    stored_progress = db.query(VocabularyProgress).first()
    assert stored_progress is not None
    assert stored_progress.correct_attempts == 5
    assert stored_progress.incorrect_attempts == 2
    assert stored_progress.mastered is False

def test_update_progress(db, sample_progress):
    # Simulate a correct answer
    sample_progress.correct_attempts += 1
    sample_progress.last_reviewed = datetime.utcnow()
    sample_progress.mastered = True
    db.commit()
    
    updated_progress = db.query(VocabularyProgress).first()
    assert updated_progress.correct_attempts == 6
    assert updated_progress.mastered is True
    assert updated_progress.last_reviewed is not None

def test_delete_progress(db, sample_progress):
    db.delete(sample_progress)
    db.commit()
    
    deleted_progress = db.query(VocabularyProgress).first()
    assert deleted_progress is None

def test_progress_vocabulary_relationship(db, sample_progress):
    # Test the relationship with vocabulary
    progress = db.query(VocabularyProgress).first()
    assert progress.vocabulary.word == "hello"
    assert progress.vocabulary.translation == "hola"