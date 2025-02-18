"""Performance tests for the Language Learning Portal API."""
import time
from typing import List
import pytest
import concurrent.futures
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary
from app.core.cache import redis_client

def create_test_data(db_session: Session, num_activities: int = 10, num_sessions: int = 100):
    """Create test data for performance testing."""
    # Create languages and vocabulary
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

    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=lang_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()

    # Create activities
    activities = []
    for i in range(num_activities):
        activity = Activity(
            type="flashcard",
            name=f"Test Activity {i}",
            description=f"Performance test activity {i}"
        )
        activity.vocabularies.append(vocabulary)
        db_session.add(activity)
        activities.append(activity)
    db_session.commit()

    # Create sessions with attempts
    for activity in activities:
        for _ in range(num_sessions // num_activities):
            session = ActivitySession(
                activity_id=activity.id,
                start_time=datetime.now(UTC)
            )
            db_session.add(session)
            db_session.commit()

            # Add attempts to achieve desired success rate
            for _ in range(5):  # 5 correct attempts
                attempt = SessionAttempt(
                    session_id=session.id,
                    vocabulary_id=vocabulary.id,
                    is_correct=True,
                    response_time_ms=1500
                )
                db_session.add(attempt)
            for _ in range(2):  # 2 incorrect attempts
                attempt = SessionAttempt(
                    session_id=session.id,
                    vocabulary_id=vocabulary.id,
                    is_correct=False,
                    response_time_ms=1500
                )
                db_session.add(attempt)
            db_session.commit()

    return activities

def measure_response_time(client: TestClient, url: str, method: str = "GET", data: dict = None) -> float:
    """Measure response time for an API endpoint."""
    start_time = time.time()
    if method == "GET":
        response = client.get(url)
    elif method == "POST":
        response = client.post(url, json=data)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    assert response.status_code in [200, 201]
    return time.time() - start_time

@pytest.fixture(autouse=True)
def clear_cache():
    """Clear Redis cache before each test."""
    redis_client.flushall()
    yield
    redis_client.flushall()

def test_dashboard_stats_performance(client: TestClient, db_session: Session):
    """Test dashboard stats endpoint performance."""
    # Create test data
    create_test_data(db_session)
    
    # Test initial request (no cache)
    cold_start_time = measure_response_time(client, "/api/v1/dashboard/stats")
    assert cold_start_time < 0.5, "Cold start response too slow"
    
    # Test cached request
    cached_time = measure_response_time(client, "/api/v1/dashboard/stats")
    assert cached_time < 0.05, "Cached response too slow"
    
    # Verify cache improvement
    assert cold_start_time > cached_time, "Caching not effective"
    assert cold_start_time / cached_time > 5, "Cache speedup insufficient"

def test_activity_list_performance(client: TestClient, db_session: Session):
    """Test activity listing performance."""
    # Create test data
    activities = create_test_data(db_session, num_activities=50)
    
    # Test response time
    response_time = measure_response_time(client, "/api/v1/activities")
    assert response_time < 0.2, "Activity list response too slow"
    
    # Test pagination performance
    page_time = measure_response_time(client, "/api/v1/activities?skip=25&limit=25")
    assert page_time < 0.1, "Paginated response too slow"

def test_session_creation_performance(client: TestClient, db_session: Session):
    """Test session creation performance."""
    # Create test activity and vocabulary
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

    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=lang_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()

    activity = Activity(type="flashcard", name="Performance Test")
    activity.vocabularies.append(vocabulary)
    db_session.add(activity)
    db_session.commit()
    
    # Test session creation time with attempts
    session_data = {
        "start_time": datetime.now(UTC).isoformat(),
        "end_time": None
    }
    
    # Measure multiple session creations
    creation_times: List[float] = []
    for _ in range(10):
        time_taken = measure_response_time(
            client,
            f"/api/v1/activities/{activity.id}/sessions",
            method="POST",
            data=session_data
        )
        creation_times.append(time_taken)
    
    avg_time = sum(creation_times) / len(creation_times)
    assert avg_time < 0.1, "Session creation too slow"

def test_progress_tracking_performance(client: TestClient, db_session: Session):
    """Test progress tracking performance."""
    # Create test data
    create_test_data(db_session, num_activities=5, num_sessions=50)
    
    # Test initial request
    cold_start_time = measure_response_time(client, "/api/v1/dashboard/progress")
    assert cold_start_time < 0.5, "Progress calculation too slow"
    
    # Test cached request
    cached_time = measure_response_time(client, "/api/v1/dashboard/progress")
    assert cached_time < 0.05, "Cached progress response too slow"

def test_concurrent_session_updates(client: TestClient, db_session: Session):
    """Test performance of concurrent session updates."""
    # Create test activity and vocabulary
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

    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=lang_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()

    activity = Activity(type="flashcard", name="Concurrent Test")
    activity.vocabularies.append(vocabulary)
    db_session.add(activity)
    db_session.commit()
    
    def update_session():
        return client.post(
            f"/api/v1/activities/{activity.id}/sessions",
            json={
                "start_time": datetime.now(UTC).isoformat(),
                "end_time": None
            }
        )
    
    # Test concurrent updates
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        start_time = time.time()
        futures = [executor.submit(update_session) for _ in range(10)]
        results = [f.result() for f in futures]
        total_time = time.time() - start_time
    
    # Verify all requests succeeded
    assert all(r.status_code == 200 for r in results)
    assert total_time < 2.0, "Concurrent updates too slow"

def test_cache_invalidation_performance(client: TestClient, db_session: Session):
    """Test cache invalidation performance."""
    # Create test data
    activity = Activity(type="flashcard", name="Cache Test")
    db_session.add(activity)
    db_session.commit()
    
    # Prime the cache
    client.get("/api/v1/dashboard/stats")
    client.get("/api/v1/dashboard/progress")
    
    # Measure time to update and invalidate cache
    start_time = time.time()
    response = client.post(
        f"/api/v1/activities/{activity.id}/sessions",
        json={
            "start_time": datetime.now(UTC).isoformat(),
            "end_time": None
        }
    )
    assert response.status_code == 200
    
    # Verify cache was invalidated
    cache_update_time = time.time() - start_time
    assert cache_update_time < 0.3, "Cache invalidation too slow"

def test_large_dataset_performance(client: TestClient, db_session: Session):
    """Test performance with large datasets."""
    # Create large test dataset
    create_test_data(db_session, num_activities=20, num_sessions=500)
    
    # Test dashboard stats
    stats_time = measure_response_time(client, "/api/v1/dashboard/stats")
    assert stats_time < 1.0, "Stats calculation too slow for large dataset"
    
    # Test progress calculation
    progress_time = measure_response_time(client, "/api/v1/dashboard/progress")
    assert progress_time < 1.0, "Progress calculation too slow for large dataset"
    
    # Test latest sessions
    sessions_time = measure_response_time(client, "/api/v1/dashboard/latest-sessions")
    assert sessions_time < 0.5, "Session retrieval too slow for large dataset"

def test_api_stress(client: TestClient, db_session: Session):
    """Stress test API endpoints."""
    # Create test data
    create_test_data(db_session, num_activities=10, num_sessions=100)
    
    endpoints = [
        "/api/v1/dashboard/stats",
        "/api/v1/dashboard/progress",
        "/api/v1/dashboard/latest-sessions",
        "/api/v1/activities"
    ]
    
    def stress_endpoint(url: str):
        return measure_response_time(client, url)
    
    # Test rapid consecutive requests
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        start_time = time.time()
        futures = []
        for _ in range(5):  # 5 rounds of requests
            for endpoint in endpoints:
                futures.append(executor.submit(stress_endpoint, endpoint))
        
        # Get results and calculate statistics
        times = [f.result() for f in futures]
        total_time = time.time() - start_time
        avg_time = sum(times) / len(times)
        max_time = max(times)
    
    assert avg_time < 0.2, "Average response time too high under load"
    assert max_time < 1.0, "Maximum response time too high under load"
    assert total_time < 5.0, "Total stress test time too high"

def test_session_attempt_performance(client: TestClient, db_session: Session):
    """Test performance of recording session attempts."""
    # Create test data
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

    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=lang_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()

    activity = Activity(type="flashcard", name="Attempt Test")
    activity.vocabularies.append(vocabulary)
    db_session.add(activity)
    db_session.commit()

    # Create a session
    session_response = client.post(
        f"/api/v1/activities/{activity.id}/sessions",
        json={
            "start_time": datetime.now(UTC).isoformat(),
            "end_time": None
        }
    )
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]

    # Test attempt recording performance
    attempt_times: List[float] = []
    for _ in range(10):
        attempt_data = {
            "vocabulary_id": vocabulary.id,
            "is_correct": True,
            "response_time_ms": 1500
        }
        time_taken = measure_response_time(
            client,
            f"/api/v1/sessions/{session_id}/attempts",
            method="POST",
            data=attempt_data
        )
        attempt_times.append(time_taken)

    avg_time = sum(attempt_times) / len(attempt_times)
    assert avg_time < 0.05, "Session attempt recording too slow"

def test_activity_retrieval_performance(client: TestClient, db_session: Session):
    """Test performance of retrieving individual activities."""
    # Create test data
    activities = create_test_data(db_session, num_activities=5)
    activity_id = activities[0].id

    # Test cold start retrieval
    cold_start_time = measure_response_time(
        client,
        f"/api/v1/activities/{activity_id}"
    )
    assert cold_start_time < 0.1, "Activity retrieval too slow"

    # Test with non-existent activity
    start_time = time.time()
    response = client.get("/api/v1/activities/99999")
    assert response.status_code == 404
    not_found_time = time.time() - start_time
    assert not_found_time < 0.1, "Not found response too slow"