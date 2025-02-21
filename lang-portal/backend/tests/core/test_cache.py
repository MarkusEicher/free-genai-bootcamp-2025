"""Tests for the cache module."""
import pytest
from datetime import datetime, UTC, timedelta
import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.testclient import TestClient
from unittest.mock import patch
from redis.exceptions import ConnectionError
from app.core.cache import (
    Cache,
    cache_response,
    invalidate_dashboard_cache,
    invalidate_stats_cache,
    test_redis_client,
    LocalCache
)
from app.core.config import settings
import threading
import asyncio
from pathlib import Path
import time

@pytest.fixture(autouse=True)
def clear_test_cache():
    """Clear test cache before and after each test."""
    test_redis_client.flushdb()
    yield
    test_redis_client.flushdb()

@pytest.fixture
def test_cache():
    """Create a test cache instance with a temporary directory."""
    cache_dir = Path(settings.BACKEND_DIR) / "data" / "test_cache"
    original_cache_dir = settings.CACHE_DIR
    
    # Update settings for test
    settings.CACHE_DIR = str(cache_dir)
    
    # Create fresh cache instance
    cache = LocalCache()
    cache._cache_dir = cache_dir
    cache._cache_dir.mkdir(parents=True, exist_ok=True)
    
    yield cache
    
    # Cleanup
    for file in cache_dir.glob("*.cache"):
        file.unlink()
    cache_dir.rmdir()
    settings.CACHE_DIR = original_cache_dir

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

def test_cache_set_get(test_cache):
    """Test basic cache set and get operations."""
    # Test setting and getting string
    assert test_cache.set("test_key", "test_value")
    assert test_cache.get("test_key") == "test_value"
    
    # Test setting and getting dict
    data = {"key": "value", "number": 42}
    assert test_cache.set("test_dict", data)
    assert test_cache.get("test_dict") == data
    
    # Test setting and getting list
    data = [1, 2, 3, "test"]
    assert test_cache.set("test_list", data)
    assert test_cache.get("test_list") == data

def test_cache_expiration(test_cache):
    """Test cache expiration functionality."""
    # Set cache with 1 second expiration
    assert test_cache.set("expire_key", "expire_value", expire=1)
    assert test_cache.get("expire_key") == "expire_value"
    
    # Wait for expiration
    time.sleep(1.1)
    assert test_cache.get("expire_key") is None
    
    # Verify cache file is deleted
    assert not list(test_cache._cache_dir.glob("*.cache"))

def test_cache_privacy(test_cache):
    """Test privacy aspects of cache implementation."""
    sensitive_data = {
        "user_id": "12345",
        "session_id": "abcdef",
        "tracking_data": {"visits": 10}
    }
    
    # Verify cache files use hash for names
    test_cache.set("sensitive_key", sensitive_data)
    cache_files = list(test_cache._cache_dir.glob("*.cache"))
    assert len(cache_files) == 1
    assert cache_files[0].name.endswith(".cache")
    assert not "sensitive" in cache_files[0].name
    
    # Verify cache file content is not plaintext
    with cache_files[0].open("r") as f:
        content = json.load(f)
        assert "sensitive_key" not in str(content)
        assert isinstance(content, dict)
        assert "value" in content
        assert "created_at" in content

def test_cache_cleanup(test_cache):
    """Test automatic cache cleanup of expired entries."""
    # Create some expired cache entries
    expired_time = (datetime.now() - timedelta(hours=1)).isoformat()
    
    cache_file = test_cache._cache_dir / "expired.cache"
    with cache_file.open("w") as f:
        json.dump({
            "value": "expired_data",
            "created_at": expired_time,
            "expires_at": expired_time
        }, f)
    
    # Create new cache instance to trigger cleanup
    new_cache = LocalCache()
    new_cache._cache_dir = test_cache._cache_dir
    
    # Verify expired cache is cleaned up
    assert not cache_file.exists()

def test_cache_response_decorator():
    """Test the cache_response decorator privacy features."""
    @cache_response(prefix="test")
    async def test_endpoint(request=None):
        return {"data": "test"}
    
    class MockRequest:
        def __init__(self):
            self.url = type('Url', (), {'path': '/test'})()
            self.query_params = {
                'user_id': '12345',
                'session': 'abcdef',
                'limit': '10',
                'offset': '0'
            }
    
    # Test that sensitive query params are excluded from cache key
    request = MockRequest()
    cache_key = ":".join(["test", "/test", str(sorted([
        ('limit', '10'),
        ('offset', '0')
    ]))])
    
    # Run the endpoint
    import asyncio
    result = asyncio.run(test_endpoint(request))
    
    # Verify result
    assert result == {"data": "test"}
    
    # Verify cache file exists with correct key
    cache_dir = Path(settings.CACHE_DIR)
    cache_files = list(cache_dir.glob("*.cache"))
    assert len(cache_files) == 1
    
    # Clean up
    for file in cache_files:
        file.unlink()

def test_cache_invalidation(test_cache):
    """Test cache invalidation functionality."""
    # Set multiple cache entries
    test_cache.set("key1", "value1")
    test_cache.set("key2", "value2")
    
    # Verify entries exist
    assert test_cache.get("key1") == "value1"
    assert test_cache.get("key2") == "value2"
    
    # Test delete single entry
    assert test_cache.delete("key1")
    assert test_cache.get("key1") is None
    assert test_cache.get("key2") == "value2"
    
    # Test clear all entries
    assert test_cache.clear()
    assert test_cache.get("key2") is None
    assert not list(test_cache._cache_dir.glob("*.cache"))

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

"""Tests for the enhanced LocalCache implementation."""
import pytest
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from app.core.cache import LocalCache

@pytest.fixture(autouse=True)
def clear_cache():
    """Clear cache before and after each test."""
    cache = LocalCache.get_instance()
    cache.clear()
    yield
    cache.clear()

@pytest.fixture
def cache():
    """Get cache instance."""
    return LocalCache.get_instance()

@pytest.fixture
def large_data():
    """Create data larger than max entry size."""
    return "x" * (1024 * 1024 * 2)  # 2MB

class TestLocalCache:
    """Test LocalCache implementation."""
    def test_singleton_instance(self):
        """Test that LocalCache is a singleton."""
        cache1 = LocalCache.get_instance()
        cache2 = LocalCache.get_instance()
        assert cache1 is cache2
    
    def test_cache_permissions(self, cache):
        """Test cache directory permissions."""
        assert cache.cache_dir.exists()
        assert oct(cache.cache_dir.stat().st_mode)[-3:] == '700'
    
    def test_basic_cache_operations(self, cache):
        """Test basic set/get/delete operations."""
        # Set and get
        assert cache.set('test_key', 'test_value')
        assert cache.get('test_key') == 'test_value'
        
        # Delete
        assert cache.delete('test_key')
        assert cache.get('test_key') is None
    
    def test_data_sanitization(self, cache):
        """Test sensitive data sanitization."""
        test_data = {
            'email': 'user@example.com',
            'password': 'secret123',
            'token': 'abc123',
            'name': 'John Doe',
            'nested': {
                'api_key': '12345',
                'safe_value': 'ok'
            }
        }
        
        cache.set('sensitive_data', test_data)
        result = cache.get('sensitive_data')
        
        assert result['email'] == '[REDACTED]'
        assert result['password'] == '[REDACTED]'
        assert result['token'] == '[REDACTED]'
        assert result['name'] == 'John Doe'
        assert result['nested']['api_key'] == '[REDACTED]'
        assert result['nested']['safe_value'] == 'ok'
    
    def test_cache_expiration(self, cache):
        """Test cache entry expiration."""
        # Set with 1 second expiration
        cache.set('expire_test', 'value', expire=1)
        assert cache.get('expire_test') == 'value'
        
        # Wait for expiration
        import time
        time.sleep(1.1)
        
        assert cache.get('expire_test') is None
        # Verify file is deleted
        assert len(list(cache.cache_dir.glob('*.cache'))) == 0
    
    def test_secure_deletion(self, cache):
        """Test secure file deletion."""
        cache.set('delete_test', 'sensitive_data')
        
        # Get cache file path
        cache_files = list(cache.cache_dir.glob('*.cache'))
        assert len(cache_files) == 1
        cache_file = cache_files[0]
        
        # Verify file content before deletion
        with open(cache_file, 'r') as f:
            assert 'sensitive_data' in f.read()
        
        # Delete and verify overwrite
        cache.delete('delete_test')
        assert not cache_file.exists()
    
    def test_size_limits(self, cache, large_data):
        """Test cache size limits."""
        # Test entry size limit
        try:
            cache.set('large_entry', large_data)
            pytest.fail("Should have raised HTTPException")
        except HTTPException as exc:
            assert exc.status_code == 413
        
        # Test total cache size limit
        for i in range(100):
            cache.set(f'key_{i}', 'x' * 1024 * 1024)  # 1MB each
        
        # Verify cleanup occurred
        total_size = sum(f.stat().st_size for f in cache.cache_dir.glob('*.cache'))
        assert total_size < cache.max_cache_size
    
    def test_concurrent_access(self, cache):
        """Test thread safety of cache operations."""
        import threading
        import queue
        
        results = queue.Queue()
        
        def worker(worker_id):
            try:
                # Multiple operations
                cache.set(f'key_{worker_id}', f'value_{worker_id}')
                value = cache.get(f'key_{worker_id}')
                cache.delete(f'key_{worker_id}')
                results.put(('success', worker_id, value))
            except Exception as e:
                results.put(('error', worker_id, str(e)))
        
        # Start multiple threads
        threads = []
        for i in range(10):
            t = threading.Thread(target=worker, args=(i,))
            threads.append(t)
            t.start()
        
        # Wait for completion
        for t in threads:
            t.join()
        
        # Check results
        while not results.empty():
            status, worker_id, value = results.get()
            assert status == 'success'
            if value is not None:  # Value might be None if get happened after delete
                assert value == f'value_{worker_id}'
    
    def test_cache_clear(self, cache):
        """Test clearing all cache entries."""
        # Add multiple entries
        for i in range(5):
            cache.set(f'key_{i}', f'value_{i}')
        
        assert len(list(cache.cache_dir.glob('*.cache'))) == 5
        
        # Clear cache
        assert cache.clear()
        
        # Verify all files are gone
        assert len(list(cache.cache_dir.glob('*.cache'))) == 0
        # Verify directory still exists with correct permissions
        assert cache.cache_dir.exists()
        assert oct(cache.cache_dir.stat().st_mode)[-3:] == '700'
    
    def test_invalid_cache_files(self, cache):
        """Test handling of invalid cache files."""
        # Create invalid cache file
        invalid_path = cache.cache_dir / 'invalid.cache'
        invalid_path.write_text('invalid json')
        
        # Attempt to get (should clean up invalid file)
        cache.get('any_key')
        
        # Verify cleanup
        assert not invalid_path.exists()
    
    def test_cache_file_permissions(self, cache):
        """Test cache file permissions."""
        cache.set('permission_test', 'value')
        
        cache_files = list(cache.cache_dir.glob('*.cache'))
        assert len(cache_files) == 1
        
        # Verify file permissions
        assert oct(cache_files[0].stat().st_mode)[-3:] == '600'
    
    def test_quota_management(self, cache):
        """Test cache quota management."""
        # Fill cache to near max
        data_size = cache.max_cache_size // 10
        for i in range(11):  # Slightly over threshold
            cache.set(f'quota_key_{i}', 'x' * data_size)
        
        # Verify cleanup occurred
        total_size = sum(f.stat().st_size for f in cache.cache_dir.glob('*.cache'))
        assert total_size < cache.max_cache_size * 0.8  # Should be reduced to below 80%