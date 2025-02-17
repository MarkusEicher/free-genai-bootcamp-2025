from datetime import datetime, UTC, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.progress import VocabularyProgress
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary

def test_create_activity(client: TestClient, db_session: Session):
    activity_data = {
        "type": "flashcard",
        "name": "Basic Vocabulary",
        "description": "Learn basic vocabulary through flashcards"
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == activity_data["type"]
    assert data["name"] == activity_data["name"]
    assert data["description"] == activity_data["description"]
    assert "id" in data
    assert "created_at" in data

def test_list_activities(client: TestClient, db_session: Session):
    # Create test activities
    activities = [
        Activity(type="flashcard", name="Test 1", description="Description 1"),
        Activity(type="quiz", name="Test 2", description="Description 2")
    ]
    for activity in activities:
        db_session.add(activity)
    db_session.commit()

    response = client.get("/api/v1/activities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all(isinstance(item["id"], int) for item in data)

def test_get_activity(client: TestClient, db_session: Session):
    # Create test activity
    activity = Activity(type="typing", name="Test Activity", description="Test Description")
    db_session.add(activity)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == activity.id
    assert data["type"] == activity.type
    assert data["name"] == activity.name
    assert data["description"] == activity.description

def test_update_activity(client: TestClient, db_session: Session):
    # Create test activity
    activity = Activity(type="quiz", name="Old Name", description="Old Description")
    db_session.add(activity)
    db_session.commit()

    update_data = {
        "name": "New Name",
        "description": "New Description"
    }
    response = client.put(f"/api/v1/activities/{activity.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == activity.id
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["type"] == activity.type  # Type should remain unchanged

def test_delete_activity(client: TestClient, db_session: Session):
    # Create test activity
    activity = Activity(type="flashcard", name="To Delete", description="Will be deleted")
    db_session.add(activity)
    db_session.commit()

    response = client.delete(f"/api/v1/activities/{activity.id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Activity deleted successfully"

    # Verify activity is deleted
    deleted_activity = db_session.query(Activity).filter(Activity.id == activity.id).first()
    assert deleted_activity is None

def test_create_session(client: TestClient, db_session: Session):
    # Create test activity
    activity = Activity(type="quiz", name="Test Activity", description="Test Description")
    db_session.add(activity)
    db_session.commit()

    session_data = {
        "start_time": datetime.now(UTC).isoformat(),
        "end_time": None
    }
    response = client.post(f"/api/v1/activities/{activity.id}/sessions", json=session_data)
    assert response.status_code == 200
    data = response.json()
    assert data["activity_id"] == activity.id
    assert "id" in data
    assert "created_at" in data

def test_list_activity_sessions(client: TestClient, db_session: Session):
    # Create test activity
    activity = Activity(type="quiz", name="Test Activity", description="Test Description")
    db_session.add(activity)
    db_session.commit()

    # Create test sessions
    sessions = [
        ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC) - timedelta(hours=i)
        )
        for i in range(3)
    ]
    for session in sessions:
        db_session.add(session)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert all(s["activity_id"] == activity.id for s in data)

def test_filter_activities_by_type(client: TestClient, db_session: Session):
    # Create test activities with different types
    activities = [
        Activity(type="flashcard", name="Flashcard 1"),
        Activity(type="quiz", name="Quiz 1"),
        Activity(type="flashcard", name="Flashcard 2")
    ]
    for activity in activities:
        db_session.add(activity)
    db_session.commit()

    response = client.get("/api/v1/activities?type=flashcard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all(item["type"] == "flashcard" for item in data)

def test_pagination_activities(client: TestClient, db_session: Session):
    # Create 15 test activities
    activities = [
        Activity(type="flashcard", name=f"Test {i}", description=f"Description {i}")
        for i in range(15)
    ]
    for activity in activities:
        db_session.add(activity)
    db_session.commit()

    # Test default pagination (limit=10)
    response = client.get("/api/v1/activities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10

    # Test custom pagination
    response = client.get("/api/v1/activities?skip=10&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5

def test_pagination_sessions(client: TestClient, db_session: Session):
    # Create test activity
    activity = Activity(type="quiz", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create 15 test sessions
    sessions = [
        ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC) - timedelta(hours=i)
        )
        for i in range(15)
    ]
    for session in sessions:
        db_session.add(session)
    db_session.commit()

    # Test default pagination
    response = client.get(f"/api/v1/activities/{activity.id}/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10

    # Test custom pagination
    response = client.get(f"/api/v1/activities/{activity.id}/sessions?skip=10&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5

def test_activity_progress(client: TestClient, db_session: Session):
    # Create test activity and progress
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create languages and language pair
    source_lang = Language(code="en", name="English")
    target_lang = Language(code="es", name="Spanish")
    db_session.add_all([source_lang, target_lang])
    db_session.commit()

    lang_pair = LanguagePair(
        source_language_id=source_lang.id,
        target_language_id=target_lang.id
    )
    db_session.add(lang_pair)
    db_session.commit()

    # Create test vocabulary and progress
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=lang_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Associate vocabulary with activity
    activity.vocabularies.append(vocabulary)
    db_session.commit()

    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=5,
        incorrect_attempts=2,
        mastered=False,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}/progress")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        entry = data[0]
        assert entry["activity_id"] == activity.id
        assert "vocabulary_id" in entry
        assert "correct_count" in entry
        assert "attempt_count" in entry
        assert "success_rate" in entry
        assert "last_attempt" in entry

def test_invalid_activity_progress(client: TestClient):
    response = client.get("/api/v1/activities/999999/progress")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

def test_update_activity_not_found(client: TestClient):
    update_data = {
        "name": "New Name",
        "description": "New Description"
    }
    response = client.put("/api/v1/activities/999999", json=update_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

def test_create_activity_validation(client: TestClient):
    # Test missing required fields
    activity_data = {
        "description": "Missing required fields"
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 422  # Validation error

    # Test empty name
    activity_data = {
        "type": "flashcard",
        "name": "",
        "description": "Empty name"
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 422  # Validation error 