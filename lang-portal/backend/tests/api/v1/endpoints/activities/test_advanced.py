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

def test_multiple_groups_practice(client: TestClient, test_base_data, db_session: Session):
    """Test practice with multiple vocabulary groups."""
    # Create two groups with different vocabularies
    group1 = VocabularyGroup(
        name="Group 1",
        description="Description 1",
        language_pair_id=test_base_data["language_pair"].id
    )
    group1.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group1)

    # Create second group with new vocabulary
    group2 = VocabularyGroup(
        name="Group 2",
        description="Description 2",
        language_pair_id=test_base_data["language_pair"].id
    )
    new_vocab = [
        Vocabulary(
            word="new1",
            translation="neu1",
            language_pair_id=test_base_data["language_pair"].id
        ),
        Vocabulary(
            word="new2",
            translation="neu2",
            language_pair_id=test_base_data["language_pair"].id
        )
    ]
    group2.vocabularies.extend(new_vocab)
    db_session.add(group2)
    db_session.add_all(new_vocab)
    db_session.commit()

    # Create activity with both groups
    response = client.post(
        "/api/v1/activities",
        json={
            "type": "flashcard",
            "name": "Multi-Group Activity",
            "description": "Activity with multiple groups",
            "vocabulary_group_ids": [group1.id, group2.id],
            "practice_direction": "forward"
        }
    )
    assert response.status_code == 200
    activity_id = response.json()["id"]

    # Get practice items
    response = client.get(f"/api/v1/activities/{activity_id}/practice")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == len(test_base_data["vocabulary"]) + len(new_vocab)

def test_session_with_attempts(client: TestClient, test_base_data, db_session: Session):
    """Test creating a session with attempts."""
    # Create group and activity
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_base_data["language_pair"].id
    )
    group.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group)
    db_session.commit()

    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    # Create session
    response = client.post(
        f"/api/v1/activities/{activity.id}/sessions",
        json={
            "start_time": datetime.now(UTC).isoformat(),
            "end_time": None
        }
    )
    assert response.status_code == 200
    session_id = response.json()["id"]

    # Record attempts
    vocab = test_base_data["vocabulary"][0]
    for is_correct in [True, False, True]:
        response = client.post(
            f"/api/v1/sessions/{session_id}/attempts",
            json={
                "vocabulary_id": vocab.id,
                "is_correct": is_correct,
                "response_time_ms": 1500
            }
        )
        assert response.status_code == 200

    # Get session details
    response = client.get(f"/api/v1/activities/{activity.id}/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    session = data[0]
    assert session["correct_count"] == 2
    assert session["incorrect_count"] == 1
    assert session["success_rate"] == pytest.approx(0.667, rel=0.01)

def test_activity_progress(client: TestClient, test_base_data, db_session: Session):
    """Test activity progress tracking."""
    # Create group and activity
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_base_data["language_pair"].id
    )
    group.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group)
    db_session.commit()

    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    # Create session and record attempts
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Add attempts for each vocabulary
    for vocab in test_base_data["vocabulary"]:
        for _ in range(5):  # 5 attempts each
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocab.id,
                is_correct=True,  # 80% success rate
                response_time_ms=1500
            )
            db_session.add(attempt)
        for _ in range(2):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocab.id,
                is_correct=False,
                response_time_ms=1500
            )
            db_session.add(attempt)
    db_session.commit()

    # Get activity progress
    response = client.get(f"/api/v1/activities/{activity.id}/progress")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(test_base_data["vocabulary"])
    for progress in data:
        assert progress["correct_count"] == 5
        assert progress["attempt_count"] == 7
        assert progress["success_rate"] == pytest.approx(0.714, rel=0.01)

def test_mixed_language_pairs(client: TestClient, test_base_data, db_session: Session):
    """Test handling groups from different language pairs."""
    # Create another language pair
    fr = test_base_data["languages"]["fr"] = Vocabulary(
        word="test_fr",
        translation="test_fr",
        language_pair_id=test_base_data["language_pair"].id + 1
    )
    db_session.add(fr)
    db_session.commit()

    # Create groups in different language pairs
    group1 = VocabularyGroup(
        name="Group EN-ES",
        description="English-Spanish group",
        language_pair_id=test_base_data["language_pair"].id
    )
    group1.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group1)

    group2 = VocabularyGroup(
        name="Group EN-FR",
        description="English-French group",
        language_pair_id=test_base_data["language_pair"].id + 1
    )
    group2.vocabularies.append(fr)
    db_session.add(group2)
    db_session.commit()

    # Try to create activity with mixed language pairs
    response = client.post(
        "/api/v1/activities",
        json={
            "type": "flashcard",
            "name": "Mixed Languages",
            "description": "Activity with mixed language pairs",
            "vocabulary_group_ids": [group1.id, group2.id],
            "practice_direction": "forward"
        }
    )
    # Should fail or warn about mixed language pairs
    assert response.status_code in [400, 422]
    assert "language pair" in response.json()["detail"]["message"].lower()

def test_concurrent_sessions(client: TestClient, test_base_data, db_session: Session):
    """Test handling concurrent practice sessions."""
    # Create group and activity
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_base_data["language_pair"].id
    )
    group.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group)
    db_session.commit()

    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    # Create multiple concurrent sessions
    session_ids = []
    for _ in range(3):
        response = client.post(
            f"/api/v1/activities/{activity.id}/sessions",
            json={
                "start_time": datetime.now(UTC).isoformat(),
                "end_time": None
            }
        )
        assert response.status_code == 200
        session_ids.append(response.json()["id"])

    # Record attempts in each session
    vocab = test_base_data["vocabulary"][0]
    for session_id in session_ids:
        response = client.post(
            f"/api/v1/sessions/{session_id}/attempts",
            json={
                "vocabulary_id": vocab.id,
                "is_correct": True,
                "response_time_ms": 1500
            }
        )
        assert response.status_code == 200

    # Verify all sessions are tracked
    response = client.get(f"/api/v1/activities/{activity.id}/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert all(s["id"] in session_ids for s in data)