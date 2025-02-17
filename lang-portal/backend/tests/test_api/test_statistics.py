import pytest
from datetime import datetime, timedelta, UTC
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from app.models.progress import VocabularyProgress
from app.models.language_pair import LanguagePair
from app.models.language import Language

def test_get_vocabulary_statistics_no_progress(client: TestClient, test_vocabulary):
    """Test getting statistics for a vocabulary with no progress"""
    response = client.get(f"/api/v1/statistics/vocabulary/{test_vocabulary.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["vocabulary_id"] == test_vocabulary.id
    assert data["word"] == test_vocabulary.word
    assert data["translation"] == test_vocabulary.translation
    assert data["correct_attempts"] == 0
    assert data["incorrect_attempts"] == 0
    assert data["success_rate"] == 0.0
    assert data["mastered"] is False
    assert data["last_reviewed"] is None

def test_get_vocabulary_statistics_with_progress(client: TestClient, db_session: Session, test_vocabulary):
    # Create progress for the vocabulary
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=5,
        incorrect_attempts=2,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()

    response = client.get(f"/api/v1/statistics/vocabulary/{test_vocabulary.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["vocabulary_id"] == test_vocabulary.id
    assert data["word"] == test_vocabulary.word
    assert data["translation"] == test_vocabulary.translation
    assert data["correct_attempts"] == 5
    assert data["incorrect_attempts"] == 2
    assert data["success_rate"] == pytest.approx(0.714, rel=1e-3)
    assert data["mastered"] is True
    assert "last_reviewed" in data

def test_get_vocabulary_statistics_not_found(client: TestClient):
    response = client.get("/api/v1/statistics/vocabulary/999")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "vocabulary_not_found"

def test_get_vocabulary_group_statistics_empty(client: TestClient, test_vocabulary_group):
    response = client.get(f"/api/v1/statistics/vocabulary-group/{test_vocabulary_group.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 0
    assert data["mastered_vocabularies"] == 0
    assert data["completion_rate"] == 0
    assert data["average_success_rate"] == 0
    assert len(data["recent_activity"]) == 0

def test_get_vocabulary_group_statistics_with_progress(
    client: TestClient,
    db_session: Session,
    test_vocabulary_group,
    test_vocabulary
):
    # Add vocabulary to group
    test_vocabulary_group.vocabularies.append(test_vocabulary)
    
    # Create progress for the vocabulary
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=8,
        incorrect_attempts=2,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()

    response = client.get(f"/api/v1/statistics/vocabulary-group/{test_vocabulary_group.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["group_id"] == test_vocabulary_group.id
    assert data["total_vocabularies"] == 1
    assert data["mastered_vocabularies"] == 1
    assert data["completion_rate"] == 100.0
    assert data["average_success_rate"] == pytest.approx(0.8, rel=1e-3)
    assert len(data["recent_activity"]) == 1

def test_get_vocabulary_group_statistics_no_progress(
    client: TestClient,
    db_session: Session,
    test_vocabulary_group,
    test_vocabulary
):
    # Add vocabulary to group without progress
    test_vocabulary_group.vocabularies.append(test_vocabulary)
    db_session.commit()

    response = client.get(f"/api/v1/statistics/vocabulary-group/{test_vocabulary_group.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 1
    assert data["mastered_vocabularies"] == 0
    assert data["completion_rate"] == 0
    assert data["average_success_rate"] == 0
    assert len(data["recent_activity"]) == 0

def test_get_vocabulary_group_statistics_mixed_progress(
    client: TestClient,
    db_session: Session,
    test_vocabulary_group,
    test_vocabulary,
    test_language_pair
):
    # Add first vocabulary with progress
    test_vocabulary_group.vocabularies.append(test_vocabulary)
    progress1 = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=8,
        incorrect_attempts=2,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress1)
    
    # Create and add second vocabulary without progress
    vocab2 = Vocabulary(
        word="test2",
        translation="test2",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab2)
    db_session.commit()
    test_vocabulary_group.vocabularies.append(vocab2)
    db_session.commit()

    response = client.get(f"/api/v1/statistics/vocabulary-group/{test_vocabulary_group.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 2
    assert data["mastered_vocabularies"] == 1
    assert data["completion_rate"] == 50.0
    assert data["average_success_rate"] == pytest.approx(0.8, rel=1e-3)
    assert len(data["recent_activity"]) == 1

def test_get_vocabulary_group_statistics_not_found(client: TestClient):
    response = client.get("/api/v1/statistics/vocabulary-group/999")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "group_not_found"

def test_get_user_statistics_empty(client: TestClient):
    response = client.get("/api/v1/statistics/user/")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 0
    assert data["total_reviews"] == 0
    assert data["correct_reviews"] == 0
    assert data["incorrect_reviews"] == 0
    assert data["mastered_count"] == 0
    assert data["average_success_rate"] == 0

def test_get_user_statistics_with_progress(
    client: TestClient,
    db_session: Session,
    test_vocabulary
):
    # Create progress for vocabulary
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=15,
        incorrect_attempts=5,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()

    response = client.get("/api/v1/statistics/user/")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 1
    assert data["total_reviews"] == 20
    assert data["correct_reviews"] == 15
    assert data["incorrect_reviews"] == 5
    assert data["mastered_count"] == 1
    assert data["average_success_rate"] == pytest.approx(0.75, rel=1e-3)

def test_get_user_statistics_multiple_vocabularies(
    client: TestClient,
    db_session: Session,
    test_vocabulary,
    test_language_pair
):
    # Create progress for first vocabulary
    progress1 = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=15,
        incorrect_attempts=5,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress1)
    
    # Create second vocabulary with progress
    vocab2 = Vocabulary(
        word="test2",
        translation="test2",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab2)
    db_session.commit()
    
    progress2 = VocabularyProgress(
        vocabulary_id=vocab2.id,
        correct_attempts=10,
        incorrect_attempts=10,
        mastered=False,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress2)
    db_session.commit()

    response = client.get("/api/v1/statistics/user/")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 2
    assert data["total_reviews"] == 40
    assert data["correct_reviews"] == 25
    assert data["incorrect_reviews"] == 15
    assert data["mastered_count"] == 1
    assert data["average_success_rate"] == pytest.approx(0.625, rel=1e-3)

def test_get_user_statistics_with_date_range(
    client: TestClient,
    db_session: Session,
    test_vocabulary
):
    # Create progress with specific dates
    start_date = datetime.now(UTC) - timedelta(days=5)
    end_date = datetime.now(UTC)
    
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=10,
        incorrect_attempts=2,
        mastered=True,
        last_reviewed=start_date + timedelta(days=1)
    )
    db_session.add(progress)
    db_session.commit()

    response = client.get(
        f"/api/v1/statistics/user/?start_date={start_date.date()}&end_date={end_date.date()}"
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_reviews"] == 12
    assert data["correct_reviews"] == 10
    assert data["incorrect_reviews"] == 2

def test_get_user_statistics_date_range_no_data(
    client: TestClient,
    db_session: Session,
    test_vocabulary
):
    # Create progress outside the date range
    past_date = datetime.now(UTC) - timedelta(days=10)
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=10,
        incorrect_attempts=2,
        mastered=True,
        last_reviewed=past_date
    )
    db_session.add(progress)
    db_session.commit()

    # Query with date range after the progress
    start_date = datetime.now(UTC) - timedelta(days=5)
    end_date = datetime.now(UTC)
    response = client.get(
        f"/api/v1/statistics/user/?start_date={start_date.date()}&end_date={end_date.date()}"
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 1  # Total vocab count is independent of date range
    assert data["total_reviews"] == 0
    assert data["correct_reviews"] == 0
    assert data["incorrect_reviews"] == 0
    assert data["mastered_count"] == 0
    assert data["average_success_rate"] == 0

def test_get_user_statistics_invalid_dates(client: TestClient):
    # Test invalid date format
    response = client.get("/api/v1/statistics/user/?start_date=invalid")
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_date_format"

    # Test end date before start date
    response = client.get(
        "/api/v1/statistics/user/?start_date=2024-01-02&end_date=2024-01-01"
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_date_range"

    # Test future end date
    future_date = (datetime.now(UTC) + timedelta(days=1)).strftime("%Y-%m-%d")
    response = client.get(f"/api/v1/statistics/user/?end_date={future_date}")
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "future_date"

def test_get_language_pair_statistics_empty(
    client: TestClient,
    test_language_pair
):
    response = client.get(f"/api/v1/statistics/language-pair/{test_language_pair.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["pair_id"] == test_language_pair.id
    assert data["source_language"] == test_language_pair.source_language.name
    assert data["target_language"] == test_language_pair.target_language.name
    assert data["total_vocabularies"] == 0
    assert data["mastered_vocabulary"] == 0
    assert data["average_success_rate"] == 0
    assert data["vocabularies_by_status"] == {
        "not_started": 0,
        "in_progress": 0,
        "mastered": 0
    }
    assert len(data["recent_activity"]) == 0

def test_get_language_pair_statistics_with_progress(
    client: TestClient,
    db_session: Session,
    test_language_pair,
    test_vocabulary
):
    # Create progress for the vocabulary
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=12,
        incorrect_attempts=3,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()

    response = client.get(f"/api/v1/statistics/language-pair/{test_language_pair.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["pair_id"] == test_language_pair.id
    assert data["source_language"] == test_language_pair.source_language.name
    assert data["target_language"] == test_language_pair.target_language.name
    assert data["total_vocabularies"] == 1
    assert data["mastered_vocabulary"] == 1
    assert data["average_success_rate"] == pytest.approx(0.8, rel=1e-3)
    assert data["vocabularies_by_status"] == {
        "not_started": 0,
        "in_progress": 0,
        "mastered": 1
    }
    assert len(data["recent_activity"]) == 1

def test_get_language_pair_statistics_mixed_progress(
    client: TestClient,
    db_session: Session,
    test_language_pair,
    test_vocabulary
):
    # Create first vocabulary with progress (mastered)
    progress1 = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=12,
        incorrect_attempts=3,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress1)
    
    # Create second vocabulary with progress (in progress)
    vocab2 = Vocabulary(
        word="test2",
        translation="test2",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab2)
    db_session.commit()
    
    progress2 = VocabularyProgress(
        vocabulary_id=vocab2.id,
        correct_attempts=5,
        incorrect_attempts=5,
        mastered=False,
        last_reviewed=datetime.now(UTC) - timedelta(minutes=5)
    )
    db_session.add(progress2)
    
    # Create third vocabulary without progress
    vocab3 = Vocabulary(
        word="test3",
        translation="test3",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab3)
    db_session.commit()

    response = client.get(f"/api/v1/statistics/language-pair/{test_language_pair.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_vocabularies"] == 3
    assert data["mastered_vocabulary"] == 1
    assert data["average_success_rate"] == pytest.approx(0.65, rel=1e-3)
    assert data["vocabularies_by_status"] == {
        "not_started": 1,
        "in_progress": 1,
        "mastered": 1
    }
    assert len(data["recent_activity"]) == 2

def test_get_language_pair_statistics_not_found(client: TestClient):
    response = client.get("/api/v1/statistics/language-pair/999")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "language_pair_not_found"