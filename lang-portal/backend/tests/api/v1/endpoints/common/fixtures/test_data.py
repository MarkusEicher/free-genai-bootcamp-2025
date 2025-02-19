import pytest
from sqlalchemy.orm import Session
from app.models.vocabulary import Vocabulary
from app.models.language import Language
from app.models.language_pair import LanguagePair
from datetime import datetime, UTC

@pytest.fixture
def test_base_data(db_session: Session):
    """Create basic test data needed by multiple tests."""
    # Create languages
    en = Language(code="en", name="English")
    es = Language(code="es", name="Spanish")
    db_session.add_all([en, es])
    db_session.commit()

    # Create language pair
    pair = LanguagePair(
        source_language_id=en.id,
        target_language_id=es.id
    )
    db_session.add(pair)
    db_session.commit()

    # Create some vocabulary
    words = [
        Vocabulary(
            word="hello",
            translation="hola",
            language_pair_id=pair.id
        ),
        Vocabulary(
            word="world",
            translation="mundo",
            language_pair_id=pair.id
        )
    ]
    db_session.add_all(words)
    db_session.commit()

    return {
        "languages": {"en": en, "es": es},
        "language_pair": pair,
        "vocabulary": words
    } 