import pytest
from datetime import datetime, UTC, timedelta
from app.models.vocabulary import Vocabulary
from app.models.progress import VocabularyProgress
from app.models.activity import Session, SessionAttempt

def test_vocabulary_progress_creation(db_session):
    """Test creating new vocabulary progress"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=0,
        incorrect_attempts=0,
        mastered=False
    )
    db_session.add(progress)
    db_session.commit()

    assert progress.id is not None
    assert progress.success_rate == 0.0
    assert not progress.mastered

def test_vocabulary_progress_success_rate(db_session):
    """Test success rate calculation"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=8,
        incorrect_attempts=2,
        mastered=False
    )
    db_session.add(progress)
    db_session.commit()

    assert progress.success_rate == 80.0

def test_vocabulary_progress_mastery_transition(db_session):
    """Test transition to mastered state"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Create progress with high success rate
    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=18,
        incorrect_attempts=2,
        mastered=False
    )
    db_session.add(progress)
    db_session.commit()

    # Success rate is 90%, should be considered mastered
    assert progress.success_rate == 90.0
    progress.mastered = progress.success_rate >= 80.0
    assert progress.mastered

def test_vocabulary_progress_mastery_loss(db_session):
    """Test losing mastered status"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Start with mastered status
    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=8,
        incorrect_attempts=2,
        mastered=True
    )
    db_session.add(progress)
    db_session.commit()

    # Add more incorrect attempts
    progress.incorrect_attempts += 3
    db_session.commit()

    # Success rate drops below 80%, should lose mastered status
    assert progress.success_rate < 80.0
    progress.mastered = progress.success_rate >= 80.0
    assert not progress.mastered

def test_vocabulary_progress_with_session_attempts(db_session):
    """Test progress updates from session attempts"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=0,
        incorrect_attempts=0,
        mastered=False
    )
    db_session.add(progress)

    # Create session
    session = Session(
        activity_id=1,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Add attempts
    attempts = [
        SessionAttempt(
            session_id=session.id,
            vocabulary_id=vocabulary.id,
            is_correct=i < 8,  # 8 correct, 2 incorrect
            response_time_ms=1000
        )
        for i in range(10)
    ]
    for attempt in attempts:
        db_session.add(attempt)
    db_session.commit()

    # Update progress based on attempts
    correct_count = sum(1 for a in attempts if a.is_correct)
    incorrect_count = len(attempts) - correct_count
    
    progress.correct_attempts = correct_count
    progress.incorrect_attempts = incorrect_count
    progress.last_reviewed = datetime.now(UTC)
    db_session.commit()

    assert progress.success_rate == 80.0
    assert progress.correct_attempts == 8
    assert progress.incorrect_attempts == 2

def test_vocabulary_progress_last_reviewed(db_session):
    """Test last reviewed timestamp updates"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Create progress with old timestamp
    old_time = datetime.now(UTC) - timedelta(days=7)
    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=0,
        incorrect_attempts=0,
        mastered=False,
        last_reviewed=old_time
    )
    db_session.add(progress)
    db_session.commit()

    # Update last reviewed
    new_time = datetime.now(UTC)
    progress.last_reviewed = new_time
    db_session.commit()

    # Verify timestamp was updated
    assert progress.last_reviewed > old_time
    assert abs((progress.last_reviewed - new_time).total_seconds()) < 1

def test_vocabulary_progress_reset(db_session):
    """Test resetting progress"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Create progress with some data
    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=10,
        incorrect_attempts=5,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()

    # Reset progress
    progress.correct_attempts = 0
    progress.incorrect_attempts = 0
    progress.mastered = False
    progress.last_reviewed = None
    db_session.commit()

    assert progress.success_rate == 0.0
    assert not progress.mastered
    assert progress.last_reviewed is None

def test_vocabulary_progress_concurrent_updates(db_session):
    """Test handling concurrent progress updates"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Create initial progress
    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=5,
        incorrect_attempts=5,
        mastered=False
    )
    db_session.add(progress)
    db_session.commit()

    # Simulate concurrent updates
    progress.correct_attempts += 1
    progress.incorrect_attempts += 1
    db_session.commit()

    assert progress.correct_attempts == 6
    assert progress.incorrect_attempts == 6
    assert progress.success_rate == 50.0

def test_vocabulary_progress_deletion(db_session):
    """Test progress deletion behavior"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=5,
        incorrect_attempts=5,
        mastered=False
    )
    db_session.add(progress)
    db_session.commit()

    # Delete progress
    db_session.delete(progress)
    db_session.commit()

    # Verify progress is deleted
    deleted_progress = db_session.query(VocabularyProgress).filter(
        VocabularyProgress.vocabulary_id == vocabulary.id
    ).first()
    assert deleted_progress is None

def test_vocabulary_progress_cascade(db_session):
    """Test progress cascade deletion with vocabulary"""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=1
    )
    db_session.add(vocabulary)
    db_session.commit()

    progress = VocabularyProgress(
        vocabulary_id=vocabulary.id,
        correct_attempts=5,
        incorrect_attempts=5,
        mastered=False
    )
    db_session.add(progress)
    db_session.commit()

    # Delete vocabulary
    db_session.delete(vocabulary)
    db_session.commit()

    # Verify progress is also deleted
    deleted_progress = db_session.query(VocabularyProgress).filter(
        VocabularyProgress.vocabulary_id == vocabulary.id
    ).first()
    assert deleted_progress is None 