import pytest
from datetime import datetime, UTC
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.activity import Activity, Session as ActivitySession
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.schemas.activity import ActivityCreate, ActivityUpdate
from app.services.activity import activity_service

@pytest.fixture
def test_setup(db_session: Session, test_language_pair):
    """Create test data for activity tests."""
    # Create vocabulary group
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    # Create vocabularies
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

def test_create_activity_with_group(db_session: Session, test_setup):
    """Test creating an activity with a vocabulary group."""
    activity_data = ActivityCreate(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        vocabulary_group_ids=[test_setup["group"].id],
        practice_direction="forward"
    )
    
    activity = activity_service.create_with_validation(db_session, obj_in=activity_data)
    assert activity.name == activity_data.name
    assert activity.type == activity_data.type
    assert len(activity.vocabulary_groups) == 1
    assert activity.vocabulary_groups[0].id == test_setup["group"].id
    assert activity.vocabulary_count == 3

def test_create_activity_without_group(db_session: Session):
    """Test creating an activity without a vocabulary group."""
    activity_data = ActivityCreate(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        vocabulary_group_ids=[],
        practice_direction="forward"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        activity_service.create_with_validation(db_session, obj_in=activity_data)
    assert exc_info.value.status_code == 400
    assert "at least one vocabulary group" in str(exc_info.value.detail)

def test_create_activity_invalid_group(db_session: Session):
    """Test creating an activity with non-existent group."""
    activity_data = ActivityCreate(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        vocabulary_group_ids=[99999],
        practice_direction="forward"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        activity_service.create_with_validation(db_session, obj_in=activity_data)
    assert exc_info.value.status_code == 404
    assert "not found" in str(exc_info.value.detail)

def test_update_activity_groups(db_session: Session, test_setup):
    """Test updating activity's vocabulary groups."""
    # Create initial activity
    activity = activity_service.create_with_validation(
        db_session,
        obj_in=ActivityCreate(
            type="flashcard",
            name="Test Activity",
            vocabulary_group_ids=[test_setup["group"].id],
            practice_direction="forward"
        )
    )
    
    # Create another group
    new_group = VocabularyGroup(
        name="New Group",
        description="New Description",
        language_pair_id=test_setup["language_pair"].id
    )
    db_session.add(new_group)
    db_session.commit()
    
    # Update activity to use both groups
    update_data = ActivityUpdate(
        vocabulary_group_ids=[test_setup["group"].id, new_group.id]
    )
    updated = activity_service.update(db_session, db_obj=activity, obj_in=update_data)
    
    assert len(updated.vocabulary_groups) == 2
    group_ids = {g.id for g in updated.vocabulary_groups}
    assert test_setup["group"].id in group_ids
    assert new_group.id in group_ids

def test_get_practice_vocabulary(db_session: Session, test_setup):
    """Test getting practice vocabulary from groups."""
    # Create activity with group
    activity = activity_service.create_with_validation(
        db_session,
        obj_in=ActivityCreate(
            type="flashcard",
            name="Test Activity",
            vocabulary_group_ids=[test_setup["group"].id],
            practice_direction="forward"
        )
    )
    
    # Get practice items
    items = activity_service.get_practice_vocabulary(db_session, activity_id=activity.id)
    assert len(items) == 3
    assert all(
        isinstance(item, dict) and
        "word" in item and
        "translation" in item and
        "vocabulary_id" in item
        for item in items
    )

def test_get_practice_vocabulary_reverse(db_session: Session, test_setup):
    """Test getting practice vocabulary in reverse direction."""
    # Create activity with reverse practice
    activity = activity_service.create_with_validation(
        db_session,
        obj_in=ActivityCreate(
            type="flashcard",
            name="Test Activity",
            vocabulary_group_ids=[test_setup["group"].id],
            practice_direction="reverse"
        )
    )
    
    items = activity_service.get_practice_vocabulary(db_session, activity_id=activity.id)
    # Verify words and translations are swapped
    assert any(
        item["word"] == "laufen" and item["translation"] == "run"
        for item in items
    )

def test_activity_vocabulary_count(db_session: Session, test_setup):
    """Test vocabulary count properties."""
    # Create activity with group
    activity = activity_service.create_with_validation(
        db_session,
        obj_in=ActivityCreate(
            type="flashcard",
            name="Test Activity",
            vocabulary_group_ids=[test_setup["group"].id],
            practice_direction="forward"
        )
    )
    
    assert activity.vocabulary_count == 3
    assert activity.unique_vocabulary_count == 3
    
    # Add same vocabulary to another group
    new_group = VocabularyGroup(
        name="New Group",
        description="New Description",
        language_pair_id=test_setup["language_pair"].id
    )
    new_group.vocabularies.append(test_setup["vocabularies"][0])  # Add existing vocabulary
    db_session.add(new_group)
    db_session.commit()
    
    # Update activity to use both groups
    activity_service.update(
        db_session,
        db_obj=activity,
        obj_in=ActivityUpdate(vocabulary_group_ids=[test_setup["group"].id, new_group.id])
    )
    
    # Total count includes duplicates, unique count doesn't
    assert activity.vocabulary_count == 4
    assert activity.unique_vocabulary_count == 3

def test_activity_language_pairs(db_session: Session, test_setup):
    """Test getting language pairs from groups."""
    activity = activity_service.create_with_validation(
        db_session,
        obj_in=ActivityCreate(
            type="flashcard",
            name="Test Activity",
            vocabulary_group_ids=[test_setup["group"].id],
            practice_direction="forward"
        )
    )
    
    assert len(activity.language_pairs) == 1
    assert test_setup["language_pair"].id in activity.language_pairs

def test_delete_activity_cascade(db_session: Session, test_setup):
    """Test that deleting activity doesn't affect groups."""
    # Create activity with group and session
    activity = activity_service.create_with_validation(
        db_session,
        obj_in=ActivityCreate(
            type="flashcard",
            name="Test Activity",
            vocabulary_group_ids=[test_setup["group"].id],
            practice_direction="forward"
        )
    )
    
    # Create session
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()
    
    # Delete activity
    activity_service.delete(db_session, id=activity.id)
    
    # Verify group still exists but session is deleted
    group = db_session.get(VocabularyGroup, test_setup["group"].id)
    assert group is not None
    assert db_session.get(ActivitySession, session.id) is None 