"""Tests for cache functionality."""
import pytest
import time
from datetime import datetime, timedelta
from app.core.cache import LocalCache, CacheMetrics
from app.core.config import settings

@pytest.fixture
def cache():
    """Create a test cache instance."""
    cache = LocalCache()
    cache.clear()  # Ensure clean state
    return cache

def test_basic_operations(cache):
    """Test basic cache operations."""
    # Test set and get
    assert cache.set("test_key", "test_value")
    assert cache.get("test_key") == "test_value"
    
    # Test non-existent key
    assert cache.get("nonexistent") is None
    
    # Test delete
    assert cache.delete("test_key")
    assert cache.get("test_key") is None

def test_expiration(cache):
    """Test cache expiration."""
    # Set with 1 second expiration
    assert cache.set("expire_key", "expire_value", expire=1)
    assert cache.get("expire_key") == "expire_value"
    
    # Wait for expiration
    time.sleep(2)
    assert cache.get("expire_key") is None

def test_privacy_sanitization(cache):
    """Test privacy-focused data sanitization."""
    sensitive_data = {
        "email": "test@example.com",
        "password": "secret123",
        "name": "Test User",
        "age": 25
    }
    
    assert cache.set("sensitive", sensitive_data)
    cached_data = cache.get("sensitive")
    
    # Check sanitization
    assert cached_data["email"] == "[REDACTED]"
    assert cached_data["password"] == "[REDACTED]"
    assert cached_data["name"] == "Test User"  # Non-sensitive
    assert cached_data["age"] == 25  # Non-sensitive

def test_activity_cache(cache):
    """Test activity-specific caching."""
    activity_data = {
        "id": 1,
        "type": "flashcard",
        "name": "Test Activity",
        "description": "Test description with email@test.com",
        "privacy_level": "private",
        "metadata": {
            "user_id": 123,
            "created_at": "2024-03-21T10:00:00Z"
        }
    }
    
    assert cache.cache_activity(1, activity_data)
    cached = cache.get_activity(1)
    
    # Check activity-specific sanitization
    assert cached["description"] == "Test description with [REDACTED]"
    assert "user_id" not in cached["metadata"]
    assert "created_at" in cached["metadata"]

def test_metrics_collection(cache):
    """Test metrics collection."""
    # Generate some cache activity
    cache.set("test1", "value1")
    cache.get("test1")  # Hit
    cache.get("nonexistent")  # Miss
    
    metrics = cache.metrics.to_dict()
    
    # Check performance metrics
    assert 0 <= metrics["performance"]["hit_ratio"] <= 1
    assert metrics["performance"]["entry_count"] > 0
    assert all(k in metrics["performance"]["response_times"] 
              for k in ["avg", "min", "max"])
    
    # Check privacy metrics
    assert 0 <= metrics["privacy"]["sanitization_rate"] <= 1
    assert metrics["privacy"]["violations"] >= 0
    
    # Check storage metrics
    assert metrics["storage"]["total_size"] > 0
    assert 0 <= metrics["storage"]["utilization"] <= 1

def test_storage_limits(cache):
    """Test storage limits and cleanup."""
    # Create large entries
    large_data = "x" * (1024 * 1024)  # 1MB
    
    # Fill cache to near max
    for i in range(10):
        cache.set(f"large_{i}", large_data)
    
    # Check cleanup triggered
    metrics = cache.metrics.to_dict()
    assert metrics["storage"]["utilization"] < 1.0

def test_concurrent_access(cache):
    """Test thread safety of cache operations."""
    import threading
    
    def worker():
        for i in range(100):
            cache.set(f"concurrent_{i}", f"value_{i}")
            cache.get(f"concurrent_{i}")
    
    threads = [threading.Thread(target=worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    # Check no data corruption
    for i in range(100):
        value = cache.get(f"concurrent_{i}")
        if value is not None:  # May be cleaned up
            assert value == f"value_{i}"

def test_secure_deletion(cache):
    """Test secure deletion of cache entries."""
    import os
    
    # Create and delete entry
    cache.set("secure_test", "sensitive_data")
    cache_path = cache._get_cache_path("secure_test")
    
    assert cache.delete("secure_test")
    
    # Verify file is completely gone
    assert not os.path.exists(cache_path)

def test_privacy_violations(cache):
    """Test privacy violation detection."""
    # Attempt to cache oversized data
    huge_data = "x" * (cache.max_entry_size + 1)
    assert not cache.set("huge", huge_data)
    
    metrics = cache.metrics.to_dict()
    assert metrics["privacy"]["violations"] > 0

@pytest.mark.asyncio
async def test_metrics_endpoint(client, admin_token_headers):
    """Test metrics endpoint."""
    response = await client.get(
        "/api/v1/metrics/cache",
        headers=admin_token_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert all(k in data for k in ["performance", "privacy", "storage"])
    assert all(k in data["performance"] for k in ["hit_ratio", "response_times", "entry_count"])
    assert all(k in data["privacy"] for k in ["sanitization_rate", "violations"])
    assert all(k in data["storage"] for k in ["total_size", "utilization"]) 