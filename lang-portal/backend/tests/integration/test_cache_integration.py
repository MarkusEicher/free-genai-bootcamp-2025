"""Integration tests for the cache system."""
import pytest
from fastapi import FastAPI, Request, HTTPException
from fastapi.testclient import TestClient
import time
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.core.cache import LocalCache, cache_response
from app.core.config import settings

@pytest.fixture(autouse=True)
def clear_test_cache():
    """Clear cache before and after each test."""
    cache = LocalCache.get_instance()
    cache.clear()
    yield
    cache.clear()

@pytest.fixture
def app():
    """Create test FastAPI application."""
    app = FastAPI()
    return app

@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)

@pytest.mark.integration
@pytest.mark.cache
class TestCacheIntegration:
    """Integration tests for cache functionality."""

    def test_basic_caching(self, app, client):
        """Test basic cache functionality with a simple endpoint."""
        counter = 0

        @app.get("/test")
        @cache_response(prefix="test")
        async def test_endpoint():
            nonlocal counter
            counter += 1
            return {"count": counter}

        # First request (cache miss)
        response1 = client.get("/test")
        assert response1.status_code == 200
        assert response1.headers["X-Cache-Status"] == "MISS"
        assert response1.json()["count"] == 1

        # Second request (cache hit)
        response2 = client.get("/test")
        assert response2.status_code == 200
        assert response2.headers["X-Cache-Status"] == "HIT"
        assert response2.json()["count"] == 1  # Counter shouldn't increment

    def test_cache_privacy(self, app, client):
        """Test privacy aspects of caching."""
        @app.get("/private")
        @cache_response(prefix="private")
        async def private_endpoint(request: Request, token: str = None):
            return {"data": "sensitive", "token": token}

        # Test with sensitive parameter
        response = client.get("/private", params={"token": "secret123"})
        assert response.status_code == 200
        assert "token" not in response.json()
        assert "X-Cache-Key" not in response.headers

    def test_cache_size_limits(self, app, client):
        """Test cache size limits and cleanup."""
        large_data = "x" * (1024 * 1024)  # 1MB of data

        @app.get("/large")
        @cache_response(prefix="large")
        async def large_endpoint():
            return {"data": large_data}

        # Test with data exceeding cache limits
        with pytest.raises(HTTPException) as exc_info:
            client.get("/large")
        assert exc_info.value.status_code == 413

    def test_concurrent_access(self, app, client):
        """Test concurrent cache access."""
        counter = 0
        
        @app.get("/concurrent")
        @cache_response(prefix="concurrent")
        async def concurrent_endpoint():
            nonlocal counter
            counter += 1
            await asyncio.sleep(0.1)  # Simulate work
            return {"count": counter}

        def make_request():
            return client.get("/concurrent")

        # Make concurrent requests
        with ThreadPoolExecutor(max_workers=5) as executor:
            responses = list(executor.map(lambda _: make_request(), range(10)))

        # All responses should have same counter value
        first_count = responses[0].json()["count"]
        assert all(r.json()["count"] == first_count for r in responses)
        assert counter == 1  # Endpoint should only be called once

    def test_cache_invalidation(self, app, client):
        """Test cache invalidation."""
        @app.get("/invalidate")
        @cache_response(prefix="invalidate", expire=1)
        async def invalidate_endpoint():
            return {"timestamp": time.time()}

        # First request
        response1 = client.get("/invalidate")
        timestamp1 = response1.json()["timestamp"]

        # Wait for cache to expire
        time.sleep(1.1)

        # Second request should get new timestamp
        response2 = client.get("/invalidate")
        timestamp2 = response2.json()["timestamp"]

        assert timestamp1 != timestamp2
        assert response2.headers["X-Cache-Status"] == "MISS"

    def test_cache_headers(self, app, client):
        """Test cache-related headers."""
        @app.get("/headers")
        @cache_response(prefix="headers", expire=60)
        async def headers_endpoint():
            return {"data": "test"}

        response = client.get("/headers")
        assert response.status_code == 200
        assert "X-Cache-Status" in response.headers
        assert "Cache-Control" in response.headers
        assert "X-Cache-Expires" in response.headers
        assert "private" in response.headers["Cache-Control"]
        assert "max-age=60" in response.headers["Cache-Control"]

    def test_error_handling(self, app, client):
        """Test error handling in cached endpoints."""
        @app.get("/error")
        @cache_response(prefix="error")
        async def error_endpoint(fail: bool = False):
            if fail:
                raise HTTPException(status_code=500, detail="Test error")
            return {"status": "ok"}

        # Successful request should be cached
        response1 = client.get("/error")
        assert response1.status_code == 200

        # Error should not be cached
        response2 = client.get("/error", params={"fail": "true"})
        assert response2.status_code == 500

        # Subsequent request should still get cached success
        response3 = client.get("/error")
        assert response3.status_code == 200
        assert response3.headers["X-Cache-Status"] == "HIT"

    def test_monitoring_capability(self, app, client):
        """Test cache monitoring capabilities."""
        cache = LocalCache.get_instance()
        
        @app.get("/monitor")
        @cache_response(prefix="monitor")
        async def monitor_endpoint():
            return {"data": "test"}

        # Make some requests
        client.get("/monitor")
        client.get("/monitor")

        # Check cache keys
        keys = cache._get_all_keys()
        assert len(keys) > 0
        assert any("monitor" in key for key in keys)

    def test_response_types(self, app, client):
        """Test caching of different response types."""
        @app.get("/json")
        @cache_response(prefix="json")
        async def json_endpoint():
            return {"type": "json"}

        @app.get("/text")
        @cache_response(prefix="text")
        async def text_endpoint():
            from fastapi.responses import PlainTextResponse
            return PlainTextResponse("plain text")

        # Test JSON response
        json_resp = client.get("/json")
        assert json_resp.status_code == 200
        assert json_resp.headers["Content-Type"] == "application/json"

        # Test text response
        text_resp = client.get("/text")
        assert text_resp.status_code == 200
        assert text_resp.headers["Content-Type"] == "text/plain; charset=utf-8" 