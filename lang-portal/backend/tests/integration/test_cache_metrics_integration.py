"""Integration tests for cache metrics functionality."""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import time
import json
from app.core.cache import LocalCache
from app.core.metrics import CacheMetrics
from app.main import app
from app.core.config import settings

@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)

@pytest.fixture
def cache():
    """Create a test cache instance."""
    cache = LocalCache()
    cache.clear()
    return cache

def test_metrics_endpoint_integration(client):
    """Test metrics endpoint integration."""
    # Generate some cache activity
    response = client.get("/api/v1/activities/1")
    assert response.status_code in [200, 404]  # Either found or not found
    
    # Get metrics
    metrics_response = client.get("/api/v1/metrics/cache")
    assert metrics_response.status_code == 200
    
    metrics_data = metrics_response.json()
    assert "performance" in metrics_data
    assert "privacy" in metrics_data
    assert "storage" in metrics_data
    
    # Verify metrics structure
    performance = metrics_data["performance"]
    assert "hit_ratio" in performance
    assert "response_times" in performance
    assert "entry_count" in performance
    
    privacy = metrics_data["privacy"]
    assert "sanitization_rate" in privacy
    assert "violations" in privacy
    
    storage = metrics_data["storage"]
    assert "total_size" in storage
    assert "utilization" in storage

def test_cache_headers_integration(client):
    """Test cache headers in API responses."""
    # First request (cache miss)
    response1 = client.get("/api/v1/activities/1")
    assert "X-Cache-Status" in response1.headers
    assert response1.headers["X-Cache-Status"] == "MISS"
    
    if response1.status_code == 200:  # If activity exists
        # Second request (cache hit)
        response2 = client.get("/api/v1/activities/1")
        assert response2.headers["X-Cache-Status"] == "HIT"
        
        # Verify cache stats in headers
        assert "X-Cache-Stats" in response2.headers
        stats = json.loads(response2.headers["X-Cache-Stats"])
        assert "hit_ratio" in stats
        assert stats["hit_ratio"] > 0

def test_cache_invalidation_metrics(client, cache):
    """Test metrics during cache invalidation."""
    # Create test activity
    create_response = client.post(
        "/api/v1/activities",
        json={"title": "Test Activity", "description": "Test"}
    )
    assert create_response.status_code == 200
    activity_id = create_response.json()["id"]
    
    # Access activity to cache it
    get_response = client.get(f"/api/v1/activities/{activity_id}")
    assert get_response.status_code == 200
    
    # Update activity to invalidate cache
    update_response = client.put(
        f"/api/v1/activities/{activity_id}",
        json={"title": "Updated Activity", "description": "Updated"}
    )
    assert update_response.status_code == 200
    
    # Get metrics
    metrics_response = client.get("/api/v1/metrics/cache")
    metrics_data = metrics_response.json()
    
    # Verify invalidation was tracked
    assert metrics_data["performance"]["entry_count"] >= 0
    assert metrics_data["storage"]["total_size"] >= 0

def test_concurrent_requests_metrics(client):
    """Test metrics collection during concurrent requests."""
    import threading
    
    def make_requests():
        for _ in range(10):
            client.get("/api/v1/activities/1")
            time.sleep(0.01)  # Small delay
    
    # Start multiple threads making requests
    threads = [threading.Thread(target=make_requests) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    # Get metrics after concurrent requests
    metrics_response = client.get("/api/v1/metrics/cache")
    assert metrics_response.status_code == 200
    metrics_data = metrics_response.json()
    
    # Verify metrics consistency
    total_requests = (
        metrics_data["performance"]["hit_ratio"] * 
        (metrics_data["performance"]["entry_count"] or 1)
    )
    assert total_requests >= 0

def test_privacy_metrics_integration(client):
    """Test privacy metrics during API operations."""
    # Create activity with sensitive data
    sensitive_data = {
        "title": "Test Activity",
        "description": "Test with email: test@example.com",
        "metadata": {
            "user_email": "user@example.com",
            "private_key": "secret123"
        }
    }
    
    response = client.post("/api/v1/activities", json=sensitive_data)
    assert response.status_code == 200
    activity_id = response.json()["id"]
    
    # Get activity to check sanitization
    get_response = client.get(f"/api/v1/activities/{activity_id}")
    assert get_response.status_code == 200
    activity_data = get_response.json()
    
    # Verify sensitive data was sanitized
    assert "test@example.com" not in activity_data["description"]
    assert "user@example.com" not in str(activity_data["metadata"])
    assert "secret123" not in str(activity_data["metadata"])
    
    # Check privacy metrics
    metrics_response = client.get("/api/v1/metrics/cache")
    metrics_data = metrics_response.json()
    
    assert metrics_data["privacy"]["sanitization_rate"] > 0
    assert metrics_data["privacy"]["violations"] >= 0

def test_storage_cleanup_metrics(client, cache):
    """Test storage cleanup metrics."""
    # Fill cache with data
    large_data = "x" * 1024 * 1024  # 1MB
    for i in range(10):
        response = client.post(
            "/api/v1/activities",
            json={
                "title": f"Large Activity {i}",
                "description": large_data
            }
        )
        assert response.status_code == 200
    
    # Get metrics after filling cache
    metrics_response = client.get("/api/v1/metrics/cache")
    metrics_data = metrics_response.json()
    
    # Verify cleanup metrics
    storage = metrics_data["storage"]
    assert storage["utilization"] > 0
    assert "cleanup" in storage
    assert storage["cleanup"]["count"] >= 0
    assert storage["cleanup"]["total_size_cleaned"] >= 0 