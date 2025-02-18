"""Tests for the cache module."""
import pytest
from datetime import datetime, UTC
import json
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from app.core.cache import (
    Cache,
    cache_response,
    invalidate_dashboard_cache,
    invalidate_stats_cache,
    get_redis_client,
    test_redis_client
)
from app.core.config import settings

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

def test_cache_invalidation():
    """Test cache invalidation functions."""
    # Set up some test cache entries
    Cache.set("dashboard:stats:1", "stats1", test_mode=True)
    Cache.set("dashboard:progress:1", "progress1", test_mode=True)
    Cache.set("dashboard:other:1", "other1", test_mode=True)

    # Test invalidate_stats_cache
    assert invalidate_stats_cache(test_mode=True)
    assert Cache.get("dashboard:stats:1", test_mode=True) is None
    assert Cache.get("dashboard:progress:1", test_mode=True) is not None

    # Test invalidate_dashboard_cache
    assert invalidate_dashboard_cache(test_mode=True)
    assert Cache.get("dashboard:progress:1", test_mode=True) is None
    assert Cache.get("dashboard:other:1", test_mode=True) is None

def test_cache_error_handling():
    """Test error handling in cache operations."""
    # Test set with invalid JSON
    class UnserializableObject:
        pass
    
    # Should return False but not raise an exception
    assert not Cache.set("invalid", UnserializableObject(), test_mode=True)

    # Test get with connection error (simulate by using invalid host)
    bad_client = get_redis_client()
    bad_client.connection_pool.connection_kwargs['host'] = 'nonexistent'
    assert Cache.get("any_key", test_mode=True) is None

def test_redis_client_configuration():
    """Test Redis client configuration."""
    # Test default client
    client = get_redis_client()
    assert client.connection_pool.connection_kwargs['host'] == settings.REDIS_HOST
    assert client.connection_pool.connection_kwargs['port'] == settings.REDIS_PORT
    assert client.connection_pool.connection_kwargs['db'] == settings.REDIS_DB

    # Test test client
    test_client = get_redis_client(test_mode=True)
    assert test_client.connection_pool.connection_kwargs['db'] == settings.REDIS_TEST_DB

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

def test_cache_invalidation_error_handling(monkeypatch):
    """Test error handling in cache invalidation functions."""
    def mock_keys(*args):
        raise ConnectionError("Connection failed")

    # Mock the keys method to simulate connection error
    monkeypatch.setattr(test_redis_client, "keys", mock_keys)

    # Test dashboard cache invalidation with connection error
    assert not invalidate_dashboard_cache(test_mode=True)

    # Test stats cache invalidation with connection error
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

def test_cache_response_with_empty_query_params():
    """Test cache_response decorator with empty query parameters."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test", include_query_params=True)
    async def test_endpoint(request: Request):
        return {"data": "test"}

    client = TestClient(app)
    
    # Test with no query params
    response1 = client.get("/test")
    assert response1.status_code == 200

    # Test with empty query params
    response2 = client.get("/test?")
    assert response2.status_code == 200

    # Both should return the same cached result
    assert response1.json() == response2.json()

def test_cache_key_builder_edge_cases():
    """Test cache key builder with edge cases."""
    # Test empty args and kwargs
    key = Cache.key_builder("test", *[], **{})
    assert key == "test"

    # Test with None values
    key = Cache.key_builder("test", None, param=None)
    assert key == "test:None:param:None"

    # Test with special characters
    key = Cache.key_builder("test", "special:char", param="with:colon")
    assert key == "test:special:char:param:with:colon"

    # Test with boolean and numeric values
    key = Cache.key_builder("test", True, 42, active=False, count=0)
    assert key == "test:True:42:active:False:count:0"

def test_cache_get_error_handling(monkeypatch):
    """Test error handling in Cache.get method."""
    def mock_get(*args, **kwargs):
        raise ConnectionError("Connection failed")

    # Mock the get method to simulate connection error
    monkeypatch.setattr(test_redis_client, "get", mock_get)
    
    # Should return None and not raise an exception
    assert Cache.get("test_key", test_mode=True) is None

def test_cache_response_edge_cases(monkeypatch):
    """Test cache_response decorator edge cases."""
    app = FastAPI()
    counter = 0

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        nonlocal counter
        counter += 1
        return {"count": counter}

    # Create test client with base URL
    client = TestClient(app, base_url="http://testserver")
    
    # Mock the request object to simulate test mode
    def mock_test_mode(*args, **kwargs):
        return True
    monkeypatch.setattr("app.core.cache.settings.TEST_DATABASE_URL", "sqlite:///./test.db")
    
    # First request
    response1 = client.get("/test")
    assert response1.status_code == 200
    assert response1.json()["count"] == 1

    # Test with query params when include_query_params=False
    response2 = client.get("/test?param=value")
    assert response2.status_code == 200
    # Should use same cache as previous request since query params are ignored
    assert response2.json()["count"] == 1

def test_cache_response_with_non_json_response():
    """Test cache_response decorator with non-JSON response."""
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        return {"text": "plain text response"}  # Return as JSON

    client = TestClient(app)
    
    # First request
    response1 = client.get("/test")
    assert response1.status_code == 200
    assert response1.json()["text"] == "plain text response"

    # Second request should get cached response
    response2 = client.get("/test")
    assert response2.status_code == 200
    assert response2.json()["text"] == "plain text response"

def test_cache_response_with_raw_text():
    """Test cache_response decorator with raw text response."""
    from fastapi.responses import PlainTextResponse
    app = FastAPI()

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        return PlainTextResponse("plain text response")

    client = TestClient(app)
    
    # First request
    response1 = client.get("/test")
    assert response1.status_code == 200
    assert response1.text == "plain text response"

    # Second request should get cached response
    response2 = client.get("/test")
    assert response2.status_code == 200
    assert response2.text == "plain text response"

def test_cache_response_missing_attributes():
    """Test cache_response decorator with missing request attributes."""
    app = FastAPI()
    counter = 0

    @app.get("/test")
    @cache_response(prefix="test")
    async def test_endpoint(request: Request):
        nonlocal counter
        counter += 1
        return {"count": counter}

    client = TestClient(app)
    
    # First request (no db_engine attribute)
    response1 = client.get("/test")
    assert response1.status_code == 200
    assert response1.json()["count"] == 1

    # Second request should not use cache since test mode couldn't be determined
    response2 = client.get("/test")
    assert response2.status_code == 200
    assert response2.json()["count"] == 2