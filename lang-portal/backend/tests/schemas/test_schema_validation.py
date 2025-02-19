import pytest
from datetime import datetime, UTC
from pydantic import ValidationError
from app.schemas.activity import (
    ActivityCreate,
    ActivityUpdate,
    SessionCreate,
    SessionAttemptCreate
)
from app.schemas.vocabulary import (
    VocabularyCreate,
    VocabularyUpdate,
    VocabularyError,
    DuplicateVocabularyError
)
from app.schemas.dashboard import (
    DashboardStats,
    DashboardProgress,
    StudyStreak,
    LatestSession
)

def test_activity_create_validation():
    """Test ActivityCreate schema validation."""
    # Valid data
    valid_data = {
        "type": "flashcard",
        "name": "Test Activity",
        "description": "Test Description"
    }
    activity = ActivityCreate(**valid_data)
    assert activity.type == valid_data["type"]
    assert activity.name == valid_data["name"]
    assert activity.description == valid_data["description"]

    # Invalid data - missing required fields
    with pytest.raises(ValidationError) as exc_info:
        ActivityCreate()
    errors = exc_info.value.errors()
    assert any(error["type"] == "missing" for error in errors)

    # Invalid data - empty name
    with pytest.raises(ValidationError):
        ActivityCreate(type="flashcard", name="")

def test_activity_update_validation():
    """Test ActivityUpdate schema validation."""
    # Valid partial update
    valid_data = {"name": "Updated Name"}
    update = ActivityUpdate(**valid_data)
    assert update.name == valid_data["name"]
    assert update.type is None
    assert update.description is None

    # Valid empty update
    empty_update = ActivityUpdate()
    assert all(value is None for value in empty_update.model_dump().values())

def test_session_create_validation():
    """Test SessionCreate schema validation."""
    # Valid data with only start time
    valid_data = {
        "start_time": datetime.now(UTC)
    }
    session = SessionCreate(**valid_data)
    assert session.start_time == valid_data["start_time"]
    assert session.end_time is None

    # Valid data with both times
    full_data = {
        "start_time": datetime.now(UTC),
        "end_time": datetime.now(UTC)
    }
    session = SessionCreate(**full_data)
    assert session.end_time == full_data["end_time"]

def test_session_attempt_create_validation():
    """Test SessionAttemptCreate schema validation."""
    # Valid data
    valid_data = {
        "vocabulary_id": 1,
        "is_correct": True,
        "response_time_ms": 1500
    }
    attempt = SessionAttemptCreate(**valid_data)
    assert attempt.vocabulary_id == valid_data["vocabulary_id"]
    assert attempt.is_correct == valid_data["is_correct"]
    assert attempt.response_time_ms == valid_data["response_time_ms"]

    # Missing required fields
    with pytest.raises(ValidationError) as exc_info:
        SessionAttemptCreate(is_correct=True)
    errors = exc_info.value.errors()
    assert any(error["loc"][0] == "vocabulary_id" for error in errors)

def test_vocabulary_create_validation():
    """Test VocabularyCreate schema validation."""
    # Valid data
    valid_data = {
        "word": "test",
        "translation": "test",
        "language_pair_id": 1
    }
    vocab = VocabularyCreate(**valid_data)
    assert vocab.word == valid_data["word"]
    assert vocab.translation == valid_data["translation"]

    # Invalid data - empty word
    with pytest.raises(ValidationError):
        VocabularyCreate(word="", translation="test", language_pair_id=1)

    # Invalid data - missing fields
    with pytest.raises(ValidationError):
        VocabularyCreate(word="test")

def test_vocabulary_update_validation():
    """Test VocabularyUpdate schema validation."""
    # Valid partial update
    valid_data = {"translation": "new translation"}
    update = VocabularyUpdate(**valid_data)
    assert update.translation == valid_data["translation"]
    assert update.word is None

    # Empty update should be valid
    empty_update = VocabularyUpdate()
    assert all(value is None for value in empty_update.model_dump().values())

def test_dashboard_stats_validation():
    """Test DashboardStats schema validation."""
    # Valid data
    valid_data = {
        "success_rate": 0.75,
        "study_sessions_count": 10,
        "active_activities_count": 5,
        "study_streak": {
            "current_streak": 3,
            "longest_streak": 5
        }
    }
    stats = DashboardStats(**valid_data)
    assert stats.success_rate == valid_data["success_rate"]
    assert stats.study_streak.current_streak == 3

    # Invalid success rate (> 1)
    with pytest.raises(ValidationError):
        DashboardStats(
            success_rate=1.5,
            study_sessions_count=10,
            active_activities_count=5,
            study_streak={"current_streak": 3, "longest_streak": 5}
        )

def test_dashboard_progress_validation():
    """Test DashboardProgress schema validation."""
    # Valid data
    valid_data = {
        "total_items": 100,
        "studied_items": 75,
        "mastered_items": 30,
        "progress_percentage": 75.0
    }
    progress = DashboardProgress(**valid_data)
    assert progress.progress_percentage == 75.0

    # Invalid progress percentage (> 100)
    with pytest.raises(ValidationError):
        DashboardProgress(
            total_items=100,
            studied_items=75,
            mastered_items=30,
            progress_percentage=150.0
        )

def test_latest_session_validation():
    """Test LatestSession schema validation."""
    # Valid data
    valid_data = {
        "activity_name": "Test Activity",
        "activity_type": "flashcard",
        "start_time": datetime.now(UTC),
        "success_rate": 0.8,
        "correct_count": 8,
        "incorrect_count": 2
    }
    session = LatestSession(**valid_data)
    assert session.success_rate == 0.8
    assert session.end_time is None  # Optional field

    # Invalid success rate (negative)
    with pytest.raises(ValidationError):
        LatestSession(
            activity_name="Test",
            activity_type="flashcard",
            start_time=datetime.now(UTC),
            success_rate=-0.1,
            correct_count=8,
            incorrect_count=2
        )

def test_error_models_validation():
    """Test error model validation."""
    # Test VocabularyError
    error_data = {
        "detail": "Test error",
        "code": "test_error"
    }
    error = VocabularyError(**error_data)
    assert error.detail == error_data["detail"]
    assert error.code == error_data["code"]

    # Test DuplicateVocabularyError
    duplicate_error_data = {
        "detail": "Duplicate vocabulary",
        "word": "test",
        "language_pair_id": 1
    }
    duplicate_error = DuplicateVocabularyError(**duplicate_error_data)
    assert duplicate_error.word == duplicate_error_data["word"]

def test_study_streak_validation():
    """Test StudyStreak schema validation."""
    # Valid data
    valid_data = {
        "current_streak": 3,
        "longest_streak": 5
    }
    streak = StudyStreak(**valid_data)
    assert streak.current_streak == 3
    assert streak.longest_streak == 5

    # Invalid negative streaks
    with pytest.raises(ValidationError):
        StudyStreak(current_streak=-1, longest_streak=5)

    with pytest.raises(ValidationError):
        StudyStreak(current_streak=3, longest_streak=-1)

def test_complex_schema_relationships():
    """Test validation of complex schema relationships."""
    # Create nested data structure
    session_data = {
        "activity_name": "Test Activity",
        "activity_type": "flashcard",
        "start_time": datetime.now(UTC),
        "end_time": datetime.now(UTC),
        "success_rate": 0.8,
        "correct_count": 8,
        "incorrect_count": 2
    }

    stats_data = {
        "success_rate": 0.75,
        "study_sessions_count": 10,
        "active_activities_count": 5,
        "study_streak": {
            "current_streak": 3,
            "longest_streak": 5
        }
    }

    # Validate nested structures
    session = LatestSession(**session_data)
    stats = DashboardStats(**stats_data)

    assert session.success_rate == 0.8
    assert stats.study_streak.current_streak == 3

def test_schema_field_constraints():
    """Test schema field constraints and validations."""
    # Test string length constraints
    with pytest.raises(ValidationError):
        ActivityCreate(type="", name="Test", description="Test")

    # Test numeric range constraints
    with pytest.raises(ValidationError):
        DashboardProgress(
            total_items=-1,
            studied_items=0,
            mastered_items=0,
            progress_percentage=0
        )

    # Test datetime constraints
    future_time = datetime(2100, 1, 1, tzinfo=UTC)
    session = SessionCreate(start_time=datetime.now(UTC), end_time=future_time)
    assert session.end_time == future_time  # Should allow future dates 