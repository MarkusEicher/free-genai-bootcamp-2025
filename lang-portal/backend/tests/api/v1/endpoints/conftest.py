from datetime import datetime
from typing import Dict, Any

import pytest
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup


@pytest.fixture
def test_base_data(db_session: Session) -> Dict[str, Any]:
    """Create basic test data for activities."""
    # Create languages
    en = Language(code="en", name="English")
    de = Language(code="de", name="German")
    db_session.add_all([en, de])
    db_session.commit()

    # Create language pair
    pair = LanguagePair(source_language_id=en.id, target_language_id=de.id)
    db_session.add(pair)
    db_session.commit()

    # Create vocabulary groups
    group1 = VocabularyGroup(
        name="Basic Verbs",
        description="Common verbs for beginners",
        language_pair_id=pair.id
    )
    group2 = VocabularyGroup(
        name="Advanced Verbs",
        description="Advanced verb forms",
        language_pair_id=pair.id
    )
    db_session.add_all([group1, group2])
    db_session.commit()

    # Create vocabulary items
    vocab1 = Vocabulary(word="run", translation="laufen", language_pair_id=pair.id)
    vocab2 = Vocabulary(word="walk", translation="gehen", language_pair_id=pair.id)
    vocab3 = Vocabulary(word="jump", translation="springen", language_pair_id=pair.id)
    vocab4 = Vocabulary(word="swim", translation="schwimmen", language_pair_id=pair.id)
    db_session.add_all([vocab1, vocab2, vocab3, vocab4])
    db_session.commit()

    # Associate vocabulary with groups
    group1.vocabularies.extend([vocab1, vocab2])
    group2.vocabularies.extend([vocab3, vocab4])
    db_session.commit()

    return {
        "languages": {"en": en, "de": de},
        "language_pair": pair,
        "groups": [group1, group2],
        "vocabularies": [vocab1, vocab2, vocab3, vocab4]
    } 