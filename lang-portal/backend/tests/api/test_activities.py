from datetime import datetime, UTC, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.vocabulary_group import VocabularyGroup
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary

@pytest.fixture
def test_vocabulary_group(db_session: Session, test_language_pair):
    """Create a test vocabulary group."""
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_language_pair.id
    )
    db_session.add(group)
    db_session.commit()
    return group

def test_create_activity(client: TestClient, db_session: Session, test_vocabulary_group):
    """Test activity creation with vocabulary group."""
    activity_data = {
        "type": "flashcard",
        "name": "Basic Vocabulary",
        "description": "Learn basic vocabulary through flashcards",
        "vocabulary_group_ids": [test_vocabulary_group.id],
        "practice_direction": "forward"
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == activity_data["type"]
    assert data["name"] == activity_data["name"]
    assert data["description"] == activity_data["description"]
    assert data["practice_direction"] == "forward"
    assert len(data["vocabulary_groups"]) == 1
    assert data["vocabulary_groups"][0]["id"] == test_vocabulary_group.id

def test_create_activity_invalid_direction(client: TestClient, db_session: Session, test_vocabulary_group):
    """Test activity creation with invalid practice direction."""
    activity_data = {
        "type": "flashcard",
        "name": "Test Activity",
        "vocabulary_group_ids": [test_vocabulary_group.id],
        "practice_direction": "invalid"
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 422
    data = response.json()
    assert "practice_direction" in str(data["detail"])

def test_create_activity_no_groups(client: TestClient, db_session: Session):
    """Test activity creation without vocabulary groups."""
    activity_data = {
        "type": "flashcard",
        "name": "Test Activity",
        "vocabulary_group_ids": []
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 400
    assert "vocabulary group" in response.json()["detail"]["message"].lower()

def test_get_activity_with_groups(client: TestClient, db_session: Session, test_vocabulary_group):
    """Test getting activity with vocabulary groups."""
    # Create activity with group
    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(test_vocabulary_group)
    db_session.add(activity)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["vocabulary_groups"]) == 1
    assert data["vocabulary_groups"][0]["id"] == test_vocabulary_group.id
    assert data["practice_direction"] == "forward"

def test_update_activity_practice_direction(client: TestClient, db_session: Session, test_vocabulary_group):
    """Test updating activity practice direction."""
    activity = Activity(
        type="flashcard",
        name="Test Activity",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(test_vocabulary_group)
    db_session.add(activity)
    db_session.commit()

    update_data = {
        "practice_direction": "reverse"
    }
    response = client.put(f"/api/v1/activities/{activity.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["practice_direction"] == "reverse"

def test_get_practice_vocabulary(client: TestClient, db_session: Session, test_vocabulary_group, test_vocabulary):
    """Test getting practice vocabulary in correct direction."""
    # Add vocabulary to group
    test_vocabulary_group.vocabularies.append(test_vocabulary)
    
    # Create activity with group
    activity = Activity(
        type="flashcard",
        name="Test Activity",
        practice_direction="reverse"
    )
    activity.vocabulary_groups.append(test_vocabulary_group)
    db_session.add(activity)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}/practice")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    # In reverse mode, word and translation are swapped
    assert data["items"][0]["word"] == test_vocabulary.translation
    assert data["items"][0]["translation"] == test_vocabulary.word

# Keep existing session and attempt tests, but update them to use vocabulary from groups
def test_session_with_group_vocabulary(client: TestClient, db_session: Session, test_vocabulary_group, test_vocabulary):
    """Test session with vocabulary from group."""
    # Add vocabulary to group
    test_vocabulary_group.vocabularies.append(test_vocabulary)
    
    # Create activity with group
    activity = Activity(
        type="flashcard",
        name="Test Activity"
    )
    activity.vocabulary_groups.append(test_vocabulary_group)
    db_session.add(activity)
    db_session.commit()

    # Create session
    session_data = {
        "start_time": datetime.now(UTC).isoformat()
    }
    session_response = client.post(f"/api/v1/activities/{activity.id}/sessions", json=session_data)
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]

    # Record attempt
    attempt_data = {
        "vocabulary_id": test_vocabulary.id,
        "is_correct": True,
        "response_time_ms": 1500
    }
    attempt_response = client.post(f"/api/v1/sessions/{session_id}/attempts", json=attempt_data)
    assert attempt_response.status_code == 200
    assert attempt_response.json()["is_correct"]