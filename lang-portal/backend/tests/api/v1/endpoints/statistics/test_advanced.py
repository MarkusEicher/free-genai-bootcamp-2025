import pytest
from datetime import datetime, UTC, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.vocabulary import Vocabulary
from app.models.progress import VocabularyProgress
from app.models.language import Language
from app.models.language_pair import LanguagePair
import random

@pytest.fixture
def test_setup(db_session: Session):
    """Create test data setup."""
    # Create languages and pair
    source = Language(code="en", name="English")
    target = Language(code="de", name="German")
    db_session.add_all([source, target])
    db_session.commit()
    
    pair = LanguagePair(
        source_language_id=source.id,
        target_language_id=target.id
    )
    db_session.add(pair)
    db_session.commit()
    
    # Create vocabularies
    vocabs = [
        Vocabulary(
            word=f"word{i}",
            translation=f"wort{i}",
            language_pair_id=pair.id
        )
        for i in range(10)
    ]
    for vocab in vocabs:
        db_session.add(vocab)
    db_session.commit()
    
    # Create activity
    activity = Activity(type="flashcard", name="Basic German")
    for vocab in vocabs:
        activity.vocabularies.append(vocab)
    db_session.add(activity)
    db_session.commit()
    
    return {
        "language_pair": pair,
        "vocabularies": vocabs,
        "activity": activity
    }

def test_overall_statistics(client: TestClient, db_session: Session, test_setup):
    """Test overall learning statistics."""
    activity = test_setup["activity"]
    vocabs = test_setup["vocabularies"]
    
    # Create sessions with attempts
    for _ in range(3):  # 3 sessions
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC)
        )
        db_session.add(session)
        db_session.commit()
        
        # Add attempts for each vocabulary
        for vocab in vocabs:
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocab.id,
                is_correct=True,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()
    
    response = client.get("/api/v1/statistics/overall")
    assert response.status_code == 200
    data = response.json()
    assert "total_study_time" in data
    assert "total_sessions" in data
    assert "average_success_rate" in data
    assert "vocabulary_mastered" in data
    assert data["total_sessions"] >= 3

def test_time_based_statistics(client: TestClient, db_session: Session, test_setup):
    """Test time-based statistics."""
    activity = test_setup["activity"]
    vocab = test_setup["vocabularies"][0]
    
    # Create sessions over different days
    for days_ago in range(5):
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC) - timedelta(days=days_ago)
        )
        db_session.add(session)
        db_session.commit()
        
        # Add attempts
        for _ in range(5):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=vocab.id,
                is_correct=True,
                response_time_ms=1500
            )
            db_session.add(attempt)
        db_session.commit()
    
    response = client.get("/api/v1/statistics/by-time")
    assert response.status_code == 200
    data = response.json()
    assert "daily" in data
    assert "weekly" in data
    assert "monthly" in data
    assert len(data["daily"]) > 0
    assert all("date" in day for day in data["daily"])
    assert all("success_rate" in day for day in data["daily"])

def test_activity_type_statistics(client: TestClient, db_session: Session, test_setup):
    """Test statistics by activity type."""
    # Create different types of activities
    activities = [
        Activity(type="flashcard", name="Flashcards"),
        Activity(type="quiz", name="Quizzes"),
        Activity(type="typing", name="Typing Practice")
    ]
    for activity in activities:
        db_session.add(activity)
    db_session.commit()
    
    # Create sessions for each activity type
    for activity in activities:
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC)
        )
        db_session.add(session)
        db_session.commit()
    
    response = client.get("/api/v1/statistics/by-activity-type")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert all("activity_type" in item for item in data)
    assert all("session_count" in item for item in data)
    assert all("average_success_rate" in item for item in data)

def test_vocabulary_difficulty_statistics(
    client: TestClient, db_session: Session, test_setup
):
    """Test vocabulary difficulty statistics."""
    vocabs = test_setup["vocabularies"]
    
    # Create progress with varying difficulty
    for i, vocab in enumerate(vocabs):
        progress = VocabularyProgress(
            vocabulary_id=vocab.id,
            correct_attempts=10 - i,  # Decreasing success
            incorrect_attempts=i,      # Increasing failures
            last_reviewed=datetime.now(UTC)
        )
        db_session.add(progress)
    db_session.commit()
    
    response = client.get("/api/v1/statistics/vocabulary-difficulty")
    assert response.status_code == 200
    data = response.json()
    assert "easy" in data
    assert "medium" in data
    assert "hard" in data
    assert all(isinstance(data[key], int) for key in ["easy", "medium", "hard"])

def test_learning_curve_statistics(client: TestClient, db_session: Session, test_setup):
    """Test learning curve statistics."""
    vocab = test_setup["vocabularies"][0]
    
    # Create progress over time
    times = [
        datetime.now(UTC) - timedelta(days=i)
        for i in range(10)
    ]
    
    for i, time in enumerate(times):
        progress = VocabularyProgress(
            vocabulary_id=vocab.id,
            correct_attempts=i * 2,    # Improving over time
            incorrect_attempts=1,
            last_reviewed=time
        )
        db_session.add(progress)
    db_session.commit()
    
    response = client.get(f"/api/v1/statistics/learning-curve/{vocab.id}")
    assert response.status_code == 200
    data = response.json()
    assert "progress_points" in data
    assert len(data["progress_points"]) > 0
    assert all("date" in point for point in data["progress_points"])
    assert all("success_rate" in point for point in data["progress_points"])

def test_session_duration_statistics(client: TestClient, db_session: Session, test_setup):
    """Test session duration statistics."""
    activity = test_setup["activity"]
    
    # Create sessions with different durations
    durations = [15, 30, 45, 60]  # minutes
    for duration in durations:
        start_time = datetime.now(UTC) - timedelta(hours=1)
        end_time = start_time + timedelta(minutes=duration)
        session = ActivitySession(
            activity_id=activity.id,
            start_time=start_time,
            end_time=end_time
        )
        db_session.add(session)
    db_session.commit()
    
    response = client.get("/api/v1/statistics/session-duration")
    assert response.status_code == 200
    data = response.json()
    assert "average_duration" in data
    assert "shortest_session" in data
    assert "longest_session" in data
    assert "duration_distribution" in data

def test_response_time_statistics(client: TestClient, db_session: Session, test_setup):
    """Test response time statistics."""
    activity = test_setup["activity"]
    vocab = test_setup["vocabularies"][0]
    
    # Create session with varying response times
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()
    
    response_times = [500, 1000, 1500, 2000, 2500]  # milliseconds
    for rt in response_times:
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=vocab.id,
            is_correct=True,
            response_time_ms=rt
        )
        db_session.add(attempt)
    db_session.commit()
    
    response = client.get("/api/v1/statistics/response-time")
    assert response.status_code == 200
    data = response.json()
    assert "average_response_time" in data
    assert "fastest_response" in data
    assert "slowest_response" in data
    assert "response_time_distribution" in data

def test_mastery_retention_statistics(
    client: TestClient, db_session: Session, test_setup
):
    """Test mastery retention statistics."""
    vocab = test_setup["vocabularies"][0]
    
    # Create progress showing mastery and retention
    times = [
        datetime.now(UTC) - timedelta(days=i * 7)  # Weekly intervals
        for i in range(4)
    ]
    
    success_rates = [85, 90, 75, 95]  # Varying success rates
    for time, rate in zip(times, success_rates):
        correct = int(rate * 20 / 100)  # 20 total attempts
        incorrect = 20 - correct
        progress = VocabularyProgress(
            vocabulary_id=vocab.id,
            correct_attempts=correct,
            incorrect_attempts=incorrect,
            last_reviewed=time
        )
        db_session.add(progress)
    db_session.commit()
    
    response = client.get("/api/v1/statistics/mastery-retention")
    assert response.status_code == 200
    data = response.json()
    assert "retention_rate" in data
    assert "average_time_to_mastery" in data
    assert "mastery_stability" in data
    assert "relearning_frequency" in data

def test_comparative_statistics(client: TestClient, db_session: Session, test_setup):
    """Test comparative statistics between activity types."""
    # Create different activity types
    activities = {
        "flashcard": Activity(type="flashcard", name="Flashcard Activity"),
        "quiz": Activity(type="quiz", name="Quiz Activity"),
        "typing": Activity(type="typing", name="Typing Activity")
    }
    for activity in activities.values():
        db_session.add(activity)
    db_session.commit()
    
    # Create sessions with different success rates
    for activity_type, activity in activities.items():
        session = ActivitySession(
            activity_id=activity.id,
            start_time=datetime.now(UTC)
        )
        db_session.add(session)
        db_session.commit()
        
        # Add attempts with different success rates
        success_rate = {
            "flashcard": 0.8,
            "quiz": 0.7,
            "typing": 0.6
        }[activity_type]
        
        for _ in range(10):
            attempt = SessionAttempt(
                session_id=session.id,
                vocabulary_id=test_setup["vocabularies"][0].id,
                is_correct=random.random() < success_rate,
                response_time_ms=1500
            )
            db_session.add(attempt)
    db_session.commit()
    
    response = client.get("/api/v1/statistics/comparative")
    assert response.status_code == 200
    data = response.json()
    assert "activity_comparison" in data
    assert "effectiveness_ranking" in data
    assert "learning_speed_comparison" in data
    assert len(data["activity_comparison"]) >= 3 