"""Tests for the cache module."""
import pytest
from datetime import datetime, UTC
import json
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from unittest.mock import patch
from redis.exceptions import ConnectionError
from app.core.cache import (
    Cache,
    cache_response,
    invalidate_dashboard_cache,
    invalidate_stats_cache,
    test_redis_client
)
from app.core.config import settings
import threading
import asyncio

@pytest.fixture(autouse=True)
def clear_test_cache():
    """Clear test cache before and after each test."""
    test_redis_client.flushdb()
    yield
    test_redis_client.flushdb()

def test_key_builder():
    """Test cache key building."""
    # Test with prefix only
    key = Cache.key_builder("test")
    assert key == "test"

    # Test with positional args
    key = Cache.key_builder("test", "arg1", "arg2")
    assert key == "test:arg1:arg2"

    # Test with keyword args
    key = Cache.key_builder("test", param1="value1", param2="value2")
    assert key == "test:param1:value1:param2:value2"

    # Test with both types of args
    key = Cache.key_builder("test", "arg1", param1="value1")
    assert key == "test:arg1:param1:value1"

    # Test with special characters
    key = Cache.key_builder("test", "special:char", param="with:colon")
    assert key == "test:special:char:param:with:colon"

    # Test with non-string values
    key = Cache.key_builder("test", 123, bool_val=True, none_val=None)
    assert key == "test:123:bool_val:True:none_val:None"

def test_cache_set_get():
    """Test basic cache set and get operations."""
    # Test string value
    assert Cache.set("test_key", "test_value", test_mode=True)
    assert Cache.get("test_key", test_mode=True) == "test_value"

    # Test dict value
    test_dict = {"key": "value", "number": 42}
    assert Cache.set("test_dict", test_dict, test_mode=True)
    cached = Cache.get("test_dict", test_mode=True)
    assert json.loads(cached) == test_dict

    # Test list value
    test_list = [1, 2, "three", {"four": 4}]
    assert Cache.set("test_list", test_list, test_mode=True)
    cached = Cache.get("test_list", test_mode=True)
    assert json.loads(cached) == test_list

    # Test None value
    assert Cache.set("test_none", None, test_mode=True)
    assert Cache.get("test_none", test_mode=True) is None

def test_cache_expiration():
    """Test cache expiration."""
    # Set with short expiration
    assert Cache.set("expire_key", "value", expire=1, test_mode=True)
    assert Cache.get("expire_key", test_mode=True) == "value"
    
    # Wait for expiration
    import time
    time.sleep(2)
    assert Cache.get("expire_key", test_mode=True) is None

def test_cache_response_decorator():
    """Test the cache_response decorator."""
    app = FastAPI()
    test_data = {"message": "Hello, World!", "timestamp": datetime.now(UTC).isoformat()}

    @app.get("/test")
    @cache_response(prefix="test", expire=60)
    async def test_endpoint(request: Request):
        return test_data

    client = TestClient(app)
    
    # First request should hit the endpoint
    response1 = client.get("/test")
    assert response1.status_code == 200
    assert response1.json() == test_data

    # Second request should hit the cache
    response2 = client.get("/test")
    assert response2.status_code == 200
    assert response2.json() == test_data

def test_cache_response_with_query_params():
    """Test cache_response decorator with query parameters."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test", expire=60, include_query_params=True)
    async def test_endpoint(request: Request, param: str = "default"):
        return {"param": param}

    client = TestClient(app)
    
    # Test different query parameters
    response1 = client.get("/test?param=value1")
    response2 = client.get("/test?param=value2")
    
    assert response1.json() != response2.json()
    assert response1.json()["param"] == "value1"
    assert response2.json()["param"] == "value2"

    # Test same query parameter (should hit cache)
    response3 = client.get("/test?param=value1")
    assert response3.json() == response1.json()

def test_cache_response_json_handling():
    """Test cache_response decorator JSON handling."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        return {
            "string": "test",
            "number": 42,
            "bool": True,
            "null": None,
            "list": [1, 2, 3],
            "dict": {"key": "value"}
        }

    client = TestClient(app)
    response = client.get("/test")
    data = response.json()
    
    assert data["string"] == "test"
    assert data["number"] == 42
    assert data["bool"] is True
    assert data["null"] is None
    assert data["list"] == [1, 2, 3]
    assert data["dict"] == {"key": "value"}

def test_cache_response_test_mode():
    """Test cache_response decorator test mode detection."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        return {"message": "test"}

    # Simulate test mode by setting db_engine
    app.state.db_engine = settings.TEST_DATABASE_URL
    
    client = TestClient(app)
    response = client.get("/test")
    assert response.status_code == 200

def test_cache_invalidation():
    """Test cache invalidation functions."""
    # Set up some test cache entries
    Cache.set("dashboard:stats:1", "stats1", test_mode=True)
    Cache.set("dashboard:progress:1", "progress1", test_mode=True)
    Cache.set("dashboard:other:1", "other1", test_mode=True)
    Cache.set("other:key", "other_value", test_mode=True)

    # Test invalidate_stats_cache
    assert invalidate_stats_cache(test_mode=True)
    assert Cache.get("dashboard:stats:1", test_mode=True) is None
    assert Cache.get("dashboard:progress:1", test_mode=True) is not None
    assert Cache.get("other:key", test_mode=True) is not None

    # Test invalidate_dashboard_cache
    assert invalidate_dashboard_cache(test_mode=True)
    assert Cache.get("dashboard:progress:1", test_mode=True) is None
    assert Cache.get("dashboard:other:1", test_mode=True) is None
    assert Cache.get("other:key", test_mode=True) is not None

def test_cache_error_handling():
    """Test error handling in cache operations."""
    # Test set with invalid JSON
    class UnserializableObject:
        pass
    
    # Should return False but not raise an exception
    assert not Cache.set("invalid", UnserializableObject(), test_mode=True)

    # Test get with connection error
    with patch('redis.Redis.get', side_effect=ConnectionError("Test error")):
        assert Cache.get("any_key", test_mode=True) is None

def test_cache_response_without_request():
    """Test cache_response decorator without request object."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint():  # No request parameter
        return {"data": "test"}

    client = TestClient(app)
    response = client.get("/test")
    assert response.status_code == 200
    assert response.json() == {"data": "test"}

def test_cache_response_invalid_json():
    """Test cache_response decorator with invalid JSON in cache."""
    app = FastAPI()
    counter = 0

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        nonlocal counter
        counter += 1
        return {"count": counter}

    client = TestClient(app)
    
    # First request
    response1 = client.get("/test")
    assert response1.json()["count"] == 1

    # Corrupt the cache with invalid JSON
    Cache.set("test:/test", "{invalid json", test_mode=True)

    # Second request should bypass cache due to invalid JSON
    response2 = client.get("/test")
    assert response2.json()["count"] == 2

def test_cache_invalidation_error_handling():
    """Test error handling in cache invalidation functions."""
    with patch('redis.Redis.keys', side_effect=ConnectionError("Test error")):
        # Both functions should return False on error
        assert not invalidate_dashboard_cache(test_mode=True)
        assert not invalidate_stats_cache(test_mode=True)

def test_cache_set_get_complex_objects():
    """Test cache operations with complex objects."""
    # Test nested dictionary
    nested_dict = {
        "level1": {
            "level2": {
                "level3": ["a", "b", "c"]
            }
        }
    }
    assert Cache.set("nested", nested_dict, test_mode=True)
    cached = Cache.get("nested", test_mode=True)
    assert json.loads(cached) == nested_dict

    # Test datetime objects
    date_obj = {
        "timestamp": datetime.now(UTC).isoformat()
    }
    assert Cache.set("date", date_obj, test_mode=True)
    cached = Cache.get("date", test_mode=True)
    assert json.loads(cached)["timestamp"] == date_obj["timestamp"]

def test_cache_key_collisions():
    """Test that similar but different cache keys don't collide."""
    # Test similar keys with different types
    Cache.set("test:1", "value1", test_mode=True)
    Cache.set("test", "1", test_mode=True)
    assert Cache.get("test:1", test_mode=True) == "value1"
    assert Cache.get("test", test_mode=True) == "1"

    # Test keys with same parts in different order
    key1 = Cache.key_builder("test", param1="a", param2="b")
    key2 = Cache.key_builder("test", param2="b", param1="a")
    Cache.set(key1, "value1", test_mode=True)
    Cache.set(key2, "value2", test_mode=True)
    assert Cache.get(key1, test_mode=True) == "value1"
    assert Cache.get(key2, test_mode=True) == "value2"
    assert key1 == key2  # Parameters should be sorted

    # Test nested keys
    Cache.set("parent:child", "value1", test_mode=True)
    Cache.set("parent", "child:value2", test_mode=True)
    assert Cache.get("parent:child", test_mode=True) == "value1"
    assert Cache.get("parent", test_mode=True) == "child:value2"

def test_concurrent_cache_access():
    """Test concurrent cache access."""
    app = FastAPI()
    request_count = 0

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        nonlocal request_count
        request_count += 1
        # Simulate slow operation
        await asyncio.sleep(0.1)
        return {"count": request_count}

    client = TestClient(app)
    
    # Make concurrent requests
    def make_request():
        return client.get("/test")

    # Create and start threads
    threads = []
    for _ in range(10):
        t = threading.Thread(target=make_request)
        threads.append(t)
        t.start()

    # Wait for all threads
    for t in threads:
        t.join()

    # Only one request should have hit the endpoint
    assert request_count == 1

def test_cache_memory_usage():
    """Test cache memory usage and limits."""
    # Test with large data
    large_data = "x" * 1024 * 1024  # 1MB string
    assert Cache.set("large_key", large_data, test_mode=True)
    
    # Test memory usage reporting
    info = test_redis_client.info(section="memory")
    assert "used_memory" in info
    initial_memory = info["used_memory"]

    # Add more large data
    for i in range(5):
        Cache.set(f"large_key_{i}", large_data, test_mode=True)
    
    # Check memory increased
    info = test_redis_client.info(section="memory")
    assert info["used_memory"] > initial_memory

    # Test memory cleanup
    for i in range(5):
        test_redis_client.delete(f"large_key_{i}")
    test_redis_client.delete("large_key")
    
    # Verify memory decreased
    info = test_redis_client.info(section="memory")
    assert info["used_memory"] < initial_memory * 2  # Allow some overhead

def test_cache_response_race_condition():
    """Test cache_response decorator under race conditions."""
    app = FastAPI()
    computation_count = 0
    cache_ready = threading.Event()

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        nonlocal computation_count
        computation_count += 1
        
        # Simulate slow computation
        await asyncio.sleep(0.1)
        
        # Wait for signal in first request
        if computation_count == 1:
            cache_ready.wait(timeout=1)
        
        return {"count": computation_count}

    client = TestClient(app)
    
    def make_request():
        return client.get("/test")

    # Start first request
    t1 = threading.Thread(target=make_request)
    t1.start()

    # Start second request while first is still computing
    t2 = threading.Thread(target=make_request)
    t2.start()

    # Let first request complete
    cache_ready.set()

    # Wait for both requests
    t1.join()
    t2.join()

    # Only one computation should have occurred
    assert computation_count == 1

def test_cache_response_with_large_query_params():
    """Test cache_response decorator with large query parameters."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test", include_query_params=True)
    async def test_endpoint(request: Request, param: str = ""):
        return {"param_length": len(param)}

    client = TestClient(app)
    
    # Test with large query parameter
    large_param = "x" * 10000
    response = client.get(f"/test?param={large_param}")
    assert response.status_code == 200
    assert response.json()["param_length"] == 10000

    # Verify cache key is reasonably sized
    cache_keys = test_redis_client.keys("test:*")
    assert all(len(key) < 1000 for key in cache_keys)  # Cache keys shouldn't be huge

def test_cache_response_error_propagation():
    """Test that errors in the endpoint are properly propagated through cache."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        raise ValueError("Test error")

    client = TestClient(app)
    
    # First request should fail
    response1 = client.get("/test")
    assert response1.status_code == 500

    # Second request should also fail (errors shouldn't be cached)
    response2 = client.get("/test")
    assert response2.status_code == 500