import pytest
from sqlalchemy.orm import Session
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from app.models.progress import VocabularyProgress
from datetime import datetime, UTC

@pytest.fixture
def db(db_session):
    """Alias for db_session"""
    return db_session

@pytest.fixture
def sample_language(db):
    language = Language(code="en", name="English")
    db.add(language)
    db.commit()
    db.refresh(language)
    return language

@pytest.fixture
def sample_language_pair(db, sample_language):
    target = Language(code="es", name="Spanish")
    db.add(target)
    db.commit()
    
    pair = LanguagePair(
        source_language_id=sample_language.id,
        target_language_id=target.id
    )
    db.add(pair)
    db.commit()
    db.refresh(pair)
    return pair

@pytest.fixture
def sample_vocabulary(db, sample_language_pair):
    vocabulary = Vocabulary(
        word="hello",
        translation="hola",
        language_pair_id=sample_language_pair.id
    )
    db.add(vocabulary)
    db.commit()
    db.refresh(vocabulary)
    return vocabulary

@pytest.fixture
def sample_vocabulary_group(db, sample_language_pair):
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=sample_language_pair.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return group

@pytest.fixture
def sample_progress(db, sample_vocabulary):
    progress = VocabularyProgress(
        vocabulary_id=sample_vocabulary.id,
        correct_attempts=5,
        incorrect_attempts=2,
        mastered=False,
        last_reviewed=datetime.now(UTC)
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress