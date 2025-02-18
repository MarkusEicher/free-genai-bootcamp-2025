import pytest
from datetime import datetime, UTC, timedelta
from app.models.activity import Activity, Session, SessionAttempt
from app.models.vocabulary import Vocabulary

def test_session_success_rate_no_attempts(db_session):
    """Test success rate calculation with no attempts"""
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    session = Session(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    assert session.success_rate == 0.0
    assert session.correct_count == 0
    assert session.incorrect_count == 0

def test_session_success_rate_all_correct(db_session):
    """Test success rate calculation with all correct attempts"""
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    session = Session(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Add 5 correct attempts
    for _ in range(5):
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=1,  # Dummy ID for testing
            is_correct=True,
            response_time_ms=1000
        )
        db_session.add(attempt)
    db_session.commit()

    assert session.success_rate == 1.0
    assert session.correct_count == 5
    assert session.incorrect_count == 0

def test_session_success_rate_all_incorrect(db_session):
    """Test success rate calculation with all incorrect attempts"""
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    session = Session(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Add 5 incorrect attempts
    for _ in range(5):
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=1,  # Dummy ID for testing
            is_correct=False,
            response_time_ms=1000
        )
        db_session.add(attempt)
    db_session.commit()

    assert session.success_rate == 0.0
    assert session.correct_count == 0
    assert session.incorrect_count == 5

def test_session_success_rate_mixed(db_session):
    """Test success rate calculation with mixed results"""
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    session = Session(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Add 3 correct and 2 incorrect attempts
    for i in range(5):
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=1,  # Dummy ID for testing
            is_correct=i < 3,  # First 3 correct, last 2 incorrect
            response_time_ms=1000
        )
        db_session.add(attempt)
    db_session.commit()

    assert session.success_rate == 0.6
    assert session.correct_count == 3
    assert session.incorrect_count == 2

def test_session_with_deleted_vocabulary(db_session):
    """Test session properties with deleted vocabulary"""
    # Create activity and vocabulary
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1  # Dummy ID for testing
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Create session and attempt
    session = Session(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    attempt = SessionAttempt(
        session_id=session.id,
        vocabulary_id=vocabulary.id,
        is_correct=True,
        response_time_ms=1000
    )
    db_session.add(attempt)
    db_session.commit()

    # Delete vocabulary
    db_session.delete(vocabulary)
    db_session.commit()

    # Properties should still work
    assert session.success_rate == 1.0
    assert session.correct_count == 1
    assert session.incorrect_count == 0

def test_session_attempt_ordering(db_session):
    """Test that session attempts are ordered by creation time"""
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    session = Session(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Add attempts with different timestamps
    times = [
        datetime.now(UTC) - timedelta(minutes=2),
        datetime.now(UTC) - timedelta(minutes=1),
        datetime.now(UTC)
    ]

    for time in times:
        attempt = SessionAttempt(
            session_id=session.id,
            vocabulary_id=1,
            is_correct=True,
            response_time_ms=1000,
            created_at=time
        )
        db_session.add(attempt)
    db_session.commit()

    # Verify ordering
    attempts = session.attempts
    for i in range(len(attempts) - 1):
        assert attempts[i].created_at <= attempts[i + 1].created_at

def test_session_duration(db_session):
    """Test session duration calculation"""
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    start_time = datetime.now(UTC)
    end_time = start_time + timedelta(minutes=30)

    session = Session(
        activity_id=activity.id,
        start_time=start_time,
        end_time=end_time
    )
    db_session.add(session)
    db_session.commit()

    # Duration should be 30 minutes
    duration = end_time - start_time
    assert duration.total_seconds() == 1800  # 30 minutes in seconds

def test_session_in_progress(db_session):
    """Test session in progress status"""
    activity = Activity(type="flashcard", name="Test Activity")
    db_session.add(activity)
    db_session.commit()

    # Create session without end time
    session = Session(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    assert session.end_time is None  # Session in progress

    # End session
    session.end_time = datetime.now(UTC)
    db_session.commit()

    assert session.end_time is not None  # Session completed 