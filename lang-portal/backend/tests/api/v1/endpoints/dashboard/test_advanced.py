from datetime import datetime, timedelta, UTC
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary

def setup_test_data(db_session: Session):
    """Helper function to set up test data."""
    # Create languages
    source_lang = Language(code="en", name="English")
    target_lang = Language(code="es", name="Spanish")
    db_session.add_all([source_lang, target_lang])
    db_session.commit()

    # Create language pair
    lang_pair = LanguagePair(
        source_language_id=source_lang.id,
        target_language_id=target_lang.id
    )
    db_session.add(lang_pair)
    db_session.commit()

    # Create vocabulary
    vocabulary = Vocabulary(
        word="hello",
        translation="hola",
        language_pair_id=lang_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()

    return vocabulary

def test_get_dashboard_stats_empty(client: TestClient, db_session: Session):
    """Test dashboard stats with no data."""
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success_rate"] == 0.0
    assert data["study_sessions_count"] == 0
    assert data["active_activities_count"] == 0
    assert data["study_streak"]["current_streak"] == 0
    assert data["study_streak"]["longest_streak"] == 0

def test_get_dashboard_stats_with_data(client: TestClient, db_session: Session):
    """Test dashboard stats with sample data."""
    vocabulary = setup_test_data(db_session)

    # Create test activities
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create test sessions with attempts
    for i in range(3):  # Create sessions for last 3 days
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC) - timedelta(days=i)
        )
        db_session.add(session)
        db_session.commit()

        # Add attempts to each session
        for _ in range(10):  # 10 attempts per session
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,  # Use the created vocabulary
                is_correct=True,  # 10 correct, 2 incorrect per session
                response_time_ms=1500
            )
            db_session.add(attempt)
        for _ in range(2):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,  # Use the created vocabulary
                is_correct=False,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()

    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success_rate"] == 0.833  # 30 correct out of 36 attempts
    assert data["study_sessions_count"] == 3
    assert data["active_activities_count"] == 1
    assert data["study_streak"]["current_streak"] == 3
    assert data["study_streak"]["longest_streak"] == 3

def test_get_dashboard_progress_empty(client: TestClient, db_session: Session):
    """Test progress stats with no data."""
    response = client.get("/api/v1/dashboard/progress")
    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 0
    assert data["studied_items"] == 0
    assert data["mastered_items"] == 0
    assert data["progress_percentage"] == 0

def test_get_dashboard_progress_with_data(client: TestClient, db_session: Session):
    """Test progress stats with sample data."""
    vocabulary = setup_test_data(db_session)

    # Create test activity
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create session
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Create attempts for the vocabulary item
    for i in range(10):
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=vocabulary.id,
            is_correct=i < 8,  # 8 correct attempts for high success rate
            response_time_ms=1500
        )
        db_session.add(attempt)
    db_session.commit()

    response = client.get("/api/v1/dashboard/progress")
    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 1
    assert data["studied_items"] == 1
    assert data["mastered_items"] == 1  # High success rate (80%)
    assert data["progress_percentage"] == 100.0  # All items have been studied

def test_get_latest_sessions_empty(client: TestClient, db_session: Session):
    """Test latest sessions with no data."""
    response = client.get("/api/v1/dashboard/latest-sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0

def test_get_latest_sessions_with_data(client: TestClient, db_session: Session):
    """Test latest sessions with sample data."""
    vocabulary = setup_test_data(db_session)

    # Create test activity
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create test sessions with attempts
    sessions = []
    for i in range(10):
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC) - timedelta(hours=i)
        )
        db_session.add(session)
        db_session.commit()
        sessions.append(session)

        # Add attempts to each session
        for j in range(10):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,
                is_correct=j < i,  # Different success rates for each session
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()

    # Test default limit
    response = client.get("/api/v1/dashboard/latest-sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5  # Default limit
    # Sessions should be ordered by time (most recent first)
    for i in range(len(data) - 1):
        assert datetime.fromisoformat(data[i]["start_time"]) > datetime.fromisoformat(data[i + 1]["start_time"])

    # Test custom limit
    response = client.get("/api/v1/dashboard/latest-sessions?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

def test_study_streak_calculation(client: TestClient, db_session: Session):
    """Test study streak calculation with gaps."""
    vocabulary = setup_test_data(db_session)

    # Create test activity
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create sessions with a gap to test streak calculation
    today = datetime.now(UTC)
    session_dates = [
        today,                          # Today
        today - timedelta(days=1),      # Yesterday
        today - timedelta(days=2),      # 2 days ago
        today - timedelta(days=5),      # Gap
        today - timedelta(days=6),      # Previous streak
        today - timedelta(days=7),      # Previous streak
    ]

    for date in session_dates:
        session = ActivitySession(
            activity_id=activity.id,
            start_time=date
        )
        db_session.add(session)
        db_session.commit()

        # Add some attempts to each session
        for _ in range(10):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,
                is_correct=True,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()

    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["study_streak"]["current_streak"] == 3  # Last 3 consecutive days
    assert data["study_streak"]["longest_streak"] == 3  # Both streaks are 3 days

def test_invalid_limit_latest_sessions(client: TestClient):
    """Test invalid limit parameter for latest sessions."""
    response = client.get("/api/v1/dashboard/latest-sessions?limit=0")
    assert response.status_code == 422  # Validation error

    response = client.get("/api/v1/dashboard/latest-sessions?limit=21")
    assert response.status_code == 422  # Validation error

def test_get_dashboard_stats_with_multiple_activities(client: TestClient, db_session: Session):
    """Test dashboard stats with multiple activities."""
    vocabulary = setup_test_data(db_session)

    # Create multiple activities
    activities = [
        Activity(type="flashcard", name="Flashcards 1"),
        Activity(type="quiz", name="Quiz 1"),
        Activity(type="typing", name="Typing Practice")
    ]
    for activity in activities:
        db_session.add(activity)
    db_session.commit()

    # Create sessions for each activity
    for activity in activities:
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC)
        )
        db_session.add(session)
        db_session.commit()

        # Add attempts to each session
        for _ in range(7):  # 7 correct attempts
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,
                is_correct=True,
                response_time_ms=1500
            )
            db_session.add(attempt)
        for _ in range(3):  # 3 incorrect attempts
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,
                is_correct=False,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()

    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success_rate"] == 0.7  # 21 correct out of 30 attempts
    assert data["study_sessions_count"] == 3
    assert data["active_activities_count"] == 3
    assert data["study_streak"]["current_streak"] == 1  # All sessions today
    assert data["study_streak"]["longest_streak"] == 1

def test_get_dashboard_progress_with_varying_mastery(client: TestClient, db_session: Session):
    """Test progress stats with varying mastery levels."""
    vocabulary = setup_test_data(db_session)

    # Create test activity
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create session
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Create attempts with varying success rates
    for i in range(10):
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=vocabulary.id,
            is_correct=i < 9,  # 90% success rate
            response_time_ms=1500
        )
        db_session.add(attempt)
    db_session.commit()

    response = client.get("/api/v1/dashboard/progress")
    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 1
    assert data["studied_items"] == 1
    assert data["mastered_items"] == 1  # High success rate (90%)
    assert data["progress_percentage"] == 100.0

def test_latest_sessions_ordering(client: TestClient, db_session: Session):
    """Test that latest sessions are properly ordered."""
    vocabulary = setup_test_data(db_session)

    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create sessions with specific timestamps
    timestamps = [
        datetime.now(UTC),
        datetime.now(UTC) - timedelta(hours=1),
        datetime.now(UTC) - timedelta(days=1),
        datetime.now(UTC) - timedelta(days=2),
    ]

    success_rates = [0.9, 0.8, 0.7, 0.6]

    for time, rate in zip(timestamps, success_rates):
        session = ActivitySession(
            activity_id=activity.id,
            start_time=time
        )
        db_session.add(session)
        db_session.commit()

        # Add attempts to match the success rate
        total_attempts = 10
        correct_attempts = int(rate * total_attempts)

        for i in range(total_attempts):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,
                is_correct=i < correct_attempts,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()

    response = client.get("/api/v1/dashboard/latest-sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    
    # Verify ordering
    for i in range(len(data) - 1):
        current_time = datetime.fromisoformat(data[i]["start_time"])
        next_time = datetime.fromisoformat(data[i + 1]["start_time"])
        assert current_time > next_time

def test_study_streak_with_multiple_sessions_per_day(client: TestClient, db_session: Session):
    """Test streak calculation with multiple sessions per day."""
    vocabulary = setup_test_data(db_session)

    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    today = datetime.now(UTC)

    # Create multiple sessions for today and yesterday
    sessions_data = [
        # Today - 3 sessions
        (today, 0.9),
        (today - timedelta(hours=2), 0.8),
        (today - timedelta(hours=4), 0.7),
        # Yesterday - 2 sessions
        (today - timedelta(days=1), 0.9),
        (today - timedelta(days=1, hours=3), 0.8),
        # Gap
        (today - timedelta(days=3), 0.7),
        # Previous streak - 2 days
        (today - timedelta(days=5), 0.8),
        (today - timedelta(days=6), 0.9)
    ]

    for time, rate in sessions_data:
        session = ActivitySession(
            activity_id=activity.id,
            start_time=time
        )
        db_session.add(session)
        db_session.commit()

        # Add attempts to match the success rate
        total_attempts = 10
        correct_attempts = int(rate * total_attempts)

        for i in range(total_attempts):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocabulary.id,
                is_correct=i < correct_attempts,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()

    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["study_streak"]["current_streak"] == 2  # Today and yesterday
    assert data["study_streak"]["longest_streak"] == 2

def test_dashboard_stats_success_rate_precision(client: TestClient, db_session: Session):
    """Test success rate calculation precision."""
    vocabulary = setup_test_data(db_session)

    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create session with precise success rate
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Add attempts to create a precise success rate (7/9 ≈ 0.778)
    for i in range(9):
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=vocabulary.id,
            is_correct=i < 7,
            response_time_ms=1500
        )
        db_session.add(attempt)
    db_session.commit()

    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert abs(data["success_rate"] - 0.778) < 0.001  # Check precision