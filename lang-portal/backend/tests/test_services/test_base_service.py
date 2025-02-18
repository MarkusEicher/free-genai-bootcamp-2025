import pytest
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.services.base import BaseService
from app.models.vocabulary import Vocabulary
from app.schemas.vocabulary import VocabularyCreate, VocabularyUpdate
from typing import Optional

# Test service implementation
class TestService(BaseService[Vocabulary, VocabularyCreate, VocabularyUpdate]):
    def __init__(self):
        super().__init__(Vocabulary)

# Create test service instance
test_service = TestService()

def test_get_nonexistent(db_session):
    """Test getting a non-existent record."""
    result = test_service.get(db_session, id=999999)
    assert result is None

def test_get_existing(db_session, test_vocabulary):
    """Test getting an existing record."""
    result = test_service.get(db_session, id=test_vocabulary.id)
    assert result is not None
    assert result.id == test_vocabulary.id
    assert result.word == test_vocabulary.word

def test_get_multi_empty(db_session):
    """Test getting multiple records when none exist."""
    results = test_service.get_multi(db_session)
    assert len(results) == 0

def test_get_multi_with_data(db_session, test_vocabulary):
    """Test getting multiple records with existing data."""
    results = test_service.get_multi(db_session)
    assert len(results) > 0
    assert any(r.id == test_vocabulary.id for r in results)

def test_get_multi_with_skip(db_session, test_vocabulary):
    """Test pagination skip parameter."""
    # Create additional records
    for i in range(5):
        vocab = Vocabulary(
            word=f"test{i}",
            translation=f"test{i}",
            language_pair_id=test_vocabulary.language_pair_id
        )
        db_session.add(vocab)
    db_session.commit()

    results = test_service.get_multi(db_session, skip=2)
    assert len(results) <= len(test_service.get_multi(db_session)) - 2

def test_get_multi_with_limit(db_session, test_vocabulary):
    """Test pagination limit parameter."""
    # Create additional records
    for i in range(5):
        vocab = Vocabulary(
            word=f"test{i}",
            translation=f"test{i}",
            language_pair_id=test_vocabulary.language_pair_id
        )
        db_session.add(vocab)
    db_session.commit()

    limit = 3
    results = test_service.get_multi(db_session, limit=limit)
    assert len(results) <= limit

def test_get_multi_with_filters(db_session, test_vocabulary):
    """Test filtering in get_multi."""
    results = test_service.get_multi(
        db_session,
        word=test_vocabulary.word
    )
    assert all(r.word == test_vocabulary.word for r in results)

def test_create_success(db_session, test_language_pair):
    """Test successful record creation."""
    vocab_data = VocabularyCreate(
        word="new_word",
        translation="new_translation",
        language_pair_id=test_language_pair.id
    )
    result = test_service.create(db_session, obj_in=vocab_data)
    assert result.id is not None
    assert result.word == vocab_data.word
    assert result.translation == vocab_data.translation

def test_create_duplicate(db_session, test_vocabulary):
    """Test creating a duplicate record."""
    vocab_data = VocabularyCreate(
        word=test_vocabulary.word,
        translation="different_translation",
        language_pair_id=test_vocabulary.language_pair_id
    )
    with pytest.raises(IntegrityError):
        test_service.create(db_session, obj_in=vocab_data)

def test_update_success(db_session, test_vocabulary):
    """Test successful record update."""
    update_data = VocabularyUpdate(translation="updated_translation")
    result = test_service.update(
        db_session,
        db_obj=test_vocabulary,
        obj_in=update_data
    )
    assert result.id == test_vocabulary.id
    assert result.translation == update_data.translation
    assert result.word == test_vocabulary.word  # Unchanged field

def test_update_with_dict(db_session, test_vocabulary):
    """Test updating with dictionary data."""
    update_data = {"translation": "dict_updated_translation"}
    result = test_service.update(
        db_session,
        db_obj=test_vocabulary,
        obj_in=update_data
    )
    assert result.translation == update_data["translation"]

def test_delete_success(db_session, test_vocabulary):
    """Test successful record deletion."""
    deleted = test_service.delete(db_session, id=test_vocabulary.id)
    assert deleted.id == test_vocabulary.id
    assert test_service.get(db_session, id=test_vocabulary.id) is None

def test_delete_nonexistent(db_session):
    """Test deleting a non-existent record."""
    with pytest.raises(HTTPException) as exc_info:
        test_service.delete(db_session, id=999999)
    assert exc_info.value.status_code == 404

def test_exists_true(db_session, test_vocabulary):
    """Test exists check with existing record."""
    assert test_service.exists(db_session, test_vocabulary.id)

def test_exists_false(db_session):
    """Test exists check with non-existent record."""
    assert not test_service.exists(db_session, 999999)

def test_get_multi_complex_filter(db_session, test_vocabulary):
    """Test get_multi with multiple filters."""
    results = test_service.get_multi(
        db_session,
        word=test_vocabulary.word,
        language_pair_id=test_vocabulary.language_pair_id
    )
    assert all(
        r.word == test_vocabulary.word and 
        r.language_pair_id == test_vocabulary.language_pair_id 
        for r in results
    )

def test_get_multi_invalid_filter(db_session):
    """Test get_multi with invalid filter field."""
    results = test_service.get_multi(
        db_session,
        invalid_field="value"  # Should be ignored
    )
    assert isinstance(results, list)  # Should not raise an error

def test_update_with_none_values(db_session, test_vocabulary):
    """Test updating with None values."""
    update_data = VocabularyUpdate(translation=None)
    result = test_service.update(
        db_session,
        db_obj=test_vocabulary,
        obj_in=update_data
    )
    assert result.translation is None
    assert result.word == test_vocabulary.word  # Unchanged field

def test_create_with_relationship(db_session, test_language_pair):
    """Test creating a record with relationship data."""
    vocab_data = VocabularyCreate(
        word="related_word",
        translation="related_translation",
        language_pair_id=test_language_pair.id
    )
    result = test_service.create(db_session, obj_in=vocab_data)
    assert result.language_pair_id == test_language_pair.id
    assert result.language_pair.id == test_language_pair.id

def test_get_multi_ordering(db_session, test_vocabulary):
    """Test implicit ordering of get_multi results."""
    # Create additional records
    for i in range(3):
        vocab = Vocabulary(
            word=f"test{i}",
            translation=f"test{i}",
            language_pair_id=test_vocabulary.language_pair_id
        )
        db_session.add(vocab)
    db_session.commit()

    results = test_service.get_multi(db_session)
    # Verify records are ordered by id
    for i in range(len(results) - 1):
        assert results[i].id < results[i + 1].id 