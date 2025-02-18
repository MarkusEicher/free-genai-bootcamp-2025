import pytest
from datetime import datetime, UTC
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.services.vocabulary_group import vocabulary_group_service
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.models.activity import Activity
from app.schemas.vocabulary_group import VocabularyGroupCreate, VocabularyGroupUpdate

@pytest.fixture
def test_setup(db_session, test_language_pair):
    """Create test data for vocabulary group tests."""
    # Create test vocabulary group
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    # Create test vocabularies
    vocab_data = [
        ("run", "laufen"),
        ("walk", "gehen"),
        ("jump", "springen")
    ]
    vocabularies = []
    for word, translation in vocab_data:
        vocab = Vocabulary(
            word=word,
            translation=translation,
            language_pair_id=test_language_pair.id
        )
        vocabularies.append(vocab)
        group.vocabularies.append(vocab)
    
    db_session.add_all(vocabularies)
    db_session.commit()

    return {
        "group": group,
        "vocabularies": vocabularies,
        "language_pair": test_language_pair
    }

def test_create_vocabulary_group(db_session, test_language_pair):
    """Test creating a new vocabulary group."""
    group_data = VocabularyGroupCreate(
        name="New Group",
        description="New Description",
        language_pair_id=test_language_pair.id
    )
    group = vocabulary_group_service.create(db_session, obj_in=group_data)
    assert group.name == group_data.name
    assert group.description == group_data.description
    assert group.language_pair_id == test_language_pair.id

def test_create_duplicate_group(db_session, test_setup):
    """Test creating a group with duplicate name in same language pair."""
    group_data = VocabularyGroupCreate(
        name=test_setup["group"].name,  # Same name as existing group
        language_pair_id=test_setup["language_pair"].id
    )
    with pytest.raises(HTTPException) as exc_info:
        vocabulary_group_service.create(db_session, obj_in=group_data)
    assert exc_info.value.status_code == 400
    assert "already exists" in str(exc_info.value.detail)

def test_get_group_with_relationships(db_session, test_setup):
    """Test getting a group with its relationships."""
    group = vocabulary_group_service.get_with_relationships(db_session, id=test_setup["group"].id)
    assert group is not None
    assert len(group.vocabularies) == 3
    assert all(isinstance(v, Vocabulary) for v in group.vocabularies)

def test_get_practice_items_forward(db_session, test_setup):
    """Test getting practice items in forward direction."""
    items = vocabulary_group_service.get_practice_items(
        db_session,
        group_id=test_setup["group"].id,
        reverse=False
    )
    assert len(items) == 3
    assert any(
        item["word"] == "run" and item["translation"] == "laufen"
        for item in items
    )

def test_get_practice_items_reverse(db_session, test_setup):
    """Test getting practice items in reverse direction."""
    items = vocabulary_group_service.get_practice_items(
        db_session,
        group_id=test_setup["group"].id,
        reverse=True
    )
    assert len(items) == 3
    assert any(
        item["word"] == "laufen" and item["translation"] == "run"
        for item in items
    )

def test_add_vocabularies(db_session, test_setup):
    """Test adding vocabularies to a group."""
    # Create new vocabulary
    new_vocab = Vocabulary(
        word="swim",
        translation="schwimmen",
        language_pair_id=test_setup["language_pair"].id
    )
    db_session.add(new_vocab)
    db_session.commit()

    # Add to group
    group = vocabulary_group_service.add_vocabularies(
        db_session,
        group_id=test_setup["group"].id,
        vocabulary_ids=[new_vocab.id]
    )
    assert len(group.vocabularies) == 4
    assert new_vocab in group.vocabularies

def test_add_vocabularies_wrong_language(db_session, test_setup):
    """Test adding vocabularies from wrong language pair."""
    # Create vocabulary in different language pair
    other_vocab = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=test_setup["language_pair"].id + 1
    )
    db_session.add(other_vocab)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        vocabulary_group_service.add_vocabularies(
            db_session,
            group_id=test_setup["group"].id,
            vocabulary_ids=[other_vocab.id]
        )
    assert exc_info.value.status_code == 400
    assert "same language pair" in str(exc_info.value.detail)

def test_remove_vocabulary(db_session, test_setup):
    """Test removing a vocabulary from a group."""
    vocab_to_remove = test_setup["vocabularies"][0]
    group = vocabulary_group_service.remove_vocabulary(
        db_session,
        group_id=test_setup["group"].id,
        vocabulary_id=vocab_to_remove.id
    )
    assert vocab_to_remove not in group.vocabularies
    assert len(group.vocabularies) == 2

def test_remove_vocabulary_with_activity(db_session, test_setup):
    """Test removing vocabulary when group is used in activity."""
    # Create activity using group
    activity = Activity(
        type="flashcard",
        name="Test Activity",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(test_setup["group"])
    db_session.add(activity)
    db_session.commit()

    # Try to remove vocabulary
    with pytest.raises(ValueError) as exc_info:
        vocabulary_group_service.remove_vocabulary(
            db_session,
            group_id=test_setup["group"].id,
            vocabulary_id=test_setup["vocabularies"][0].id
        )
    assert "used in active activities" in str(exc_info.value)

def test_delete_group(db_session, test_setup):
    """Test deleting a vocabulary group."""
    group_id = test_setup["group"].id
    vocabulary_group_service.delete(db_session, id=group_id)
    assert vocabulary_group_service.get(db_session, id=group_id) is None

def test_delete_group_with_activity(db_session, test_setup):
    """Test deleting group when used in activity."""
    # Create activity using group
    activity = Activity(
        type="flashcard",
        name="Test Activity",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(test_setup["group"])
    db_session.add(activity)
    db_session.commit()

    # Try to delete group
    with pytest.raises(ValueError) as exc_info:
        vocabulary_group_service.delete(db_session, id=test_setup["group"].id)
    assert "used in active activities" in str(exc_info.value)

def test_update_group(db_session, test_setup):
    """Test updating a vocabulary group."""
    update_data = VocabularyGroupUpdate(
        name="Updated Name",
        description="Updated Description"
    )
    group = vocabulary_group_service.update(
        db_session,
        db_obj=test_setup["group"],
        obj_in=update_data
    )
    assert group.name == update_data.name
    assert group.description == update_data.description
    assert group.language_pair_id == test_setup["language_pair"].id  # Unchanged

def test_get_nonexistent_group(db_session):
    """Test getting a non-existent group."""
    group = vocabulary_group_service.get(db_session, id=99999)
    assert group is None

def test_add_duplicate_vocabulary(db_session, test_setup):
    """Test adding vocabulary that's already in group."""
    existing_vocab = test_setup["vocabularies"][0]
    group = vocabulary_group_service.add_vocabularies(
        db_session,
        group_id=test_setup["group"].id,
        vocabulary_ids=[existing_vocab.id]
    )
    # Should not add duplicate
    assert len(group.vocabularies) == 3
    assert group.vocabularies.count(existing_vocab) == 1 