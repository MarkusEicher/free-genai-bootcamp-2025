import pytest
from datetime import datetime, UTC, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.vocabulary import Vocabulary
from app.models.progress import VocabularyProgress
from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.language import Language
from app.models.language_pair import LanguagePair

@pytest.fixture
def test_setup(db_session: Session):
    """Create test data setup."""
    # Create languages and pair
    source = Language(code="en", name="English")
    target = Language(code="fr", name="French")
    db_session.add_all([source, target])
    db_session.commit()
    
    pair = LanguagePair(
        source_language_id=source.id,
        target_language_id=target.id
    )
    db_session.add(pair)
    db_session.commit()
    
    # Create vocabulary
    vocab = Vocabulary(
        word="hello",
        translation="bonjour",
        language_pair_id=pair.id
    )
    db_session.add(vocab)
    db_session.commit()
    
    # Create activity
    activity = Activity(
        type="flashcard",
        name="Basic French"
    )
    activity.vocabularies.append(vocab)
    db_session.add(activity)
    db_session.commit()
    
    return {
        "language_pair": pair,
        "vocabulary": vocab,
        "activity": activity
    }

def test_track_vocabulary_progress(client: TestClient, db_session: Session, test_setup):
    """Test tracking vocabulary progress."""
    vocab = test_setup["vocabulary"]
    
    # Record progress
    progress_data = {
        "vocabulary_id": vocab.id,
        "correct_attempts": 5,
        "incorrect_attempts": 2,
        "last_reviewed": datetime.now(UTC).isoformat()
    }
    response = client.post("/api/v1/progress/vocabulary", json=progress_data)
    assert response.status_code == 200
    data = response.json()
    assert data["vocabulary_id"] == vocab.id
    assert data["success_rate"] == (5 / 7) * 100  # 71.43%
    assert not data["mastered"]  # Below 80% threshold

def test_get_vocabulary_progress(client: TestClient, db_session: Session, test_setup):
    """Test getting vocabulary progress."""
    vocab = test_setup["vocabulary"]
    
    # Create progress record
    progress = VocabularyProgress(
        vocabulary_id=vocab.id,
        correct_attempts=8,
        incorrect_attempts=2,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()
    
    response = client.get(f"/api/v1/progress/vocabulary/{vocab.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success_rate"] == 80.0
    assert data["mastered"]  # 80% threshold reached

def test_update_vocabulary_progress(client: TestClient, db_session: Session, test_setup):
    """Test updating vocabulary progress."""
    vocab = test_setup["vocabulary"]
    
    # Create initial progress
    progress = VocabularyProgress(
        vocabulary_id=vocab.id,
        correct_attempts=5,
        incorrect_attempts=5,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()
    
    # Update progress
    update_data = {
        "correct_attempts": 15,  # Improved performance
        "incorrect_attempts": 5
    }
    response = client.put(
        f"/api/v1/progress/vocabulary/{vocab.id}",
        json=update_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success_rate"] == 75.0
    assert data["mastered"] is False  # Still below 80%

def test_track_session_progress(client: TestClient, db_session: Session, test_setup):
    """Test tracking progress within a session."""
    activity = test_setup["activity"]
    vocab = test_setup["vocabulary"]
    
    # Create session
    session_data = {
        "start_time": datetime.now(UTC).isoformat()
    }
    session_response = client.post(
        f"/api/v1/activities/{activity.id}/sessions",
        json=session_data
    )
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]
    
    # Record attempts
    attempts = [
        {"vocabulary_id": vocab.id, "is_correct": True, "response_time_ms": 1500},
        {"vocabulary_id": vocab.id, "is_correct": False, "response_time_ms": 2000},
        {"vocabulary_id": vocab.id, "is_correct": True, "response_time_ms": 1200}
    ]
    
    for attempt in attempts:
        response = client.post(
            f"/api/v1/sessions/{session_id}/attempts",
            json=attempt
        )
        assert response.status_code == 200
    
    # Verify progress was updated
    progress_response = client.get(f"/api/v1/progress/vocabulary/{vocab.id}")
    data = progress_response.json()
    assert data["correct_count"] == 2
    assert data["incorrect_count"] == 1

def test_progress_history(client: TestClient, db_session: Session, test_setup):
    """Test retrieving progress history."""
    vocab = test_setup["vocabulary"]
    
    # Create progress entries over time
    times = [
        datetime.now(UTC) - timedelta(days=i)
        for i in range(5)
    ]
    
    for i, time in enumerate(times):
        progress = VocabularyProgress(
            vocabulary_id=vocab.id,
            correct_attempts=i * 2,
            incorrect_attempts=i,
            last_reviewed=time
        )
        db_session.add(progress)
    db_session.commit()
    
    response = client.get(f"/api/v1/progress/vocabulary/{vocab.id}/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert all("success_rate" in entry for entry in data)
    assert all("timestamp" in entry for entry in data)

def test_activity_progress(client: TestClient, db_session: Session, test_setup):
    """Test tracking activity-level progress."""
    activity = test_setup["activity"]
    vocab = test_setup["vocabulary"]
    
    # Create multiple sessions with attempts
    for _ in range(3):
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC)
        )
        db_session.add(session)
        db_session.commit()
        
        # Add attempts
        for _ in range(5):  # 5 attempts per session
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocab.id,
                is_correct=True,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()
    
    response = client.get(f"/api/v1/activities/{activity.id}/progress")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all("success_rate" in item for item in data)
    assert all("vocabulary_id" in item for item in data)

def test_mastery_calculation(client: TestClient, db_session: Session, test_setup):
    """Test vocabulary mastery calculation."""
    vocab = test_setup["vocabulary"]
    
    # Create progress with high success rate
    progress = VocabularyProgress(
        vocabulary_id=vocab.id,
        correct_attempts=16,
        incorrect_attempts=4,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()
    
    response = client.get(f"/api/v1/progress/vocabulary/{vocab.id}/mastery")
    assert response.status_code == 200
    data = response.json()
    assert data["mastered"] is True
    assert data["success_rate"] == 80.0
    assert "mastery_achieved_date" in data

def test_progress_statistics(client: TestClient, db_session: Session, test_setup):
    """Test progress statistics calculation."""
    vocab = test_setup["vocabulary"]
    
    # Create progress data
    progress = VocabularyProgress(
        vocabulary_id=vocab.id,
        correct_attempts=30,
        incorrect_attempts=10,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()
    
    response = client.get(f"/api/v1/progress/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "total_vocabulary_count" in data
    assert "mastered_vocabulary_count" in data
    assert "average_success_rate" in data
    assert "study_streak" in data

def test_reset_progress(client: TestClient, db_session: Session, test_setup):
    """Test resetting progress."""
    vocab = test_setup["vocabulary"]
    
    # Create progress
    progress = VocabularyProgress(
        vocabulary_id=vocab.id,
        correct_attempts=10,
        incorrect_attempts=5,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()
    
    # Reset progress
    response = client.post(f"/api/v1/progress/vocabulary/{vocab.id}/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["correct_attempts"] == 0
    assert data["incorrect_attempts"] == 0
    assert data["mastered"] is False

def test_bulk_progress_update(client: TestClient, db_session: Session, test_setup):
    """Test bulk progress update."""
    vocab = test_setup["vocabulary"]
    
    # Create multiple progress updates
    updates = [
        {
            "vocabulary_id": vocab.id,
            "correct_attempts": i,
            "incorrect_attempts": 1,
            "last_reviewed": datetime.now(UTC).isoformat()
        }
        for i in range(5)
    ]
    
    response = client.post("/api/v1/progress/vocabulary/bulk", json=updates)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert all("success_rate" in item for item in data)

def test_progress_decay(client: TestClient, db_session: Session, test_setup):
    """Test progress decay over time."""
    vocab = test_setup["vocabulary"]
    
    # Create old progress
    old_time = datetime.now(UTC) - timedelta(days=30)
    progress = VocabularyProgress(
        vocabulary_id=vocab.id,
        correct_attempts=20,
        incorrect_attempts=5,
        last_reviewed=old_time
    )
    db_session.add(progress)
    db_session.commit()
    
    response = client.get(f"/api/v1/progress/vocabulary/{vocab.id}/decay")
    assert response.status_code == 200
    data = response.json()
    assert "original_success_rate" in data
    assert "current_success_rate" in data
    assert "decay_factor" in data
    assert data["current_success_rate"] < data["original_success_rate"] 