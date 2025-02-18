import pytest
from unittest.mock import patch, MagicMock
from redis.exceptions import ConnectionError, ResponseError
from app.core.cache import (
    Cache,
    invalidate_dashboard_cache,
    invalidate_stats_cache,
    test_redis_client
)

@pytest.fixture(autouse=True)
def clear_test_cache():
    """Clear test cache before and after each test."""
    test_redis_client.flushdb()
    yield
    test_redis_client.flushdb()

def test_invalidate_dashboard_cache_with_no_keys():
    """Test invalidating dashboard cache when no keys exist"""
    # Cache should be empty
    assert test_redis_client.dbsize() == 0
    
    # Invalidation should succeed even with no keys
    assert invalidate_dashboard_cache(test_mode=True)

def test_invalidate_dashboard_cache_with_mixed_keys():
    """Test invalidating dashboard cache with mixed key types"""
    # Set up test data
    test_redis_client.set("dashboard:stats:1", "test")
    test_redis_client.set("dashboard:progress:1", "test")
    test_redis_client.set("other:key", "test")
    
    # Invalidate dashboard cache
    assert invalidate_dashboard_cache(test_mode=True)
    
    # Verify dashboard keys are gone but others remain
    assert test_redis_client.get("dashboard:stats:1") is None
    assert test_redis_client.get("dashboard:progress:1") is None
    assert test_redis_client.get("other:key") == "test"

def test_invalidate_stats_cache_specific():
    """Test invalidating only stats cache"""
    # Set up test data
    test_redis_client.set("dashboard:stats:1", "test")
    test_redis_client.set("dashboard:progress:1", "test")
    
    # Invalidate stats cache
    assert invalidate_stats_cache(test_mode=True)
    
    # Verify only stats cache is invalidated
    assert test_redis_client.get("dashboard:stats:1") is None
    assert test_redis_client.get("dashboard:progress:1") == "test"

def test_invalidate_cache_connection_error():
    """Test cache invalidation with connection error"""
    with patch('app.core.cache.test_redis_client.keys') as mock_keys:
        mock_keys.side_effect = ConnectionError("Test connection error")
        
        # Both invalidation functions should return False
        assert not invalidate_dashboard_cache(test_mode=True)
        assert not invalidate_stats_cache(test_mode=True)

def test_invalidate_cache_delete_error():
    """Test cache invalidation with delete error"""
    with patch('app.core.cache.test_redis_client') as mock_client:
        # Mock keys to return some values
        mock_client.keys.return_value = ["dashboard:stats:1"]
        # Mock delete to raise an error
        mock_client.delete.side_effect = ResponseError("Test delete error")
        
        # Invalidation should return False
        assert not invalidate_dashboard_cache(test_mode=True)

def test_invalidate_cache_partial_failure():
    """Test cache invalidation with partial failure"""
    # Set up test data
    test_redis_client.set("dashboard:stats:1", "test")
    test_redis_client.set("dashboard:progress:1", "test")
    
    with patch('app.core.cache.test_redis_client.delete') as mock_delete:
        # Mock delete to succeed for first call and fail for second
        mock_delete.side_effect = [True, ResponseError("Test error")]
        
        # Invalidation should still succeed overall
        assert invalidate_dashboard_cache(test_mode=True)

def test_invalidate_cache_with_pattern_matching():
    """Test cache invalidation with complex pattern matching"""
    # Set up test data with various patterns
    keys = [
        "dashboard:stats:1",
        "dashboard:stats:user:1",
        "dashboard:stats:activity:1",
        "dashboard:progress:1",
        "dashboard:other:1"
    ]
    for key in keys:
        test_redis_client.set(key, "test")
    
    # Invalidate stats cache
    assert invalidate_stats_cache(test_mode=True)
    
    # Verify all stats keys are gone
    assert test_redis_client.get("dashboard:stats:1") is None
    assert test_redis_client.get("dashboard:stats:user:1") is None
    assert test_redis_client.get("dashboard:stats:activity:1") is None
    # Other keys should remain
    assert test_redis_client.get("dashboard:progress:1") == "test"
    assert test_redis_client.get("dashboard:other:1") == "test"

def test_invalidate_cache_concurrent_modifications():
    """Test cache invalidation with concurrent modifications"""
    # Set up initial data
    test_redis_client.set("dashboard:stats:1", "test")
    
    def mock_keys_with_modification(*args, **kwargs):
        # Simulate another process adding a key during invalidation
        test_redis_client.set("dashboard:stats:2", "test")
        return test_redis_client.keys(*args, **kwargs)
    
    with patch('app.core.cache.test_redis_client.keys', side_effect=mock_keys_with_modification):
        # Invalidation should still succeed
        assert invalidate_stats_cache(test_mode=True)
        
        # Both keys should be gone
        assert test_redis_client.get("dashboard:stats:1") is None
        assert test_redis_client.get("dashboard:stats:2") is None

def test_invalidate_cache_empty_pattern():
    """Test cache invalidation with empty pattern match"""
    # Set up data that doesn't match the pattern
    test_redis_client.set("other:key", "test")
    
    # Invalidation should succeed even with no matching keys
    assert invalidate_stats_cache(test_mode=True)
    
    # Other keys should remain
    assert test_redis_client.get("other:key") == "test"

def test_invalidate_cache_large_dataset():
    """Test cache invalidation with a large number of keys"""
    # Set up many keys
    for i in range(1000):
        test_redis_client.set(f"dashboard:stats:{i}", "test")
    
    # Invalidation should handle large datasets
    assert invalidate_stats_cache(test_mode=True)
    
    # Verify all keys are gone
    assert test_redis_client.dbsize() == 0 