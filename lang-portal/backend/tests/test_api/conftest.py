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
    """Returns a database session for testing"""
    return db_session