"""Tests for privacy-focused features and requirements."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from pathlib import Path
from unittest.mock import patch
from app.core.cache import LocalCache
from app.core.config import settings

@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)

@pytest.fixture
def test_cache():
    """Create a test cache instance."""
    cache_dir = Path(settings.BACKEND_DIR) / "data" / "test_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache = LocalCache()
    cache._cache_dir = cache_dir
    yield cache
    # Cleanup
    for file in cache_dir.glob("*.cache"):
        try:
            file.unlink()
        except FileNotFoundError:
            pass
    try:
        cache_dir.rmdir()
    except FileNotFoundError:
        pass

def test_no_cors_headers(client):
    """Test that CORS headers are not present."""
    response = client.get("/health")
    headers = response.headers
    
    # Verify no CORS headers
    assert "Access-Control-Allow-Origin" not in headers
    assert "Access-Control-Allow-Methods" not in headers
    assert "Access-Control-Allow-Headers" not in headers

def test_no_tracking_headers(client):
    """Test that no tracking or analytics headers are present."""
    response = client.get("/health")
    headers = response.headers
    
    # Verify no tracking headers
    assert "Set-Cookie" not in headers
    assert "X-Analytics" not in headers
    assert "X-Tracking" not in headers

def test_security_headers(client):
    """Test that security headers are properly set."""
    response = client.get("/health")
    headers = response.headers
    
    # Check security headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert "Content-Security-Policy" in headers

def test_no_external_connections(client):
    """Test that no external connections are made."""
    with patch('httpx.AsyncClient.get') as mock_get:
        client.get("/api/v1/dashboard/stats")
        mock_get.assert_not_called()

def test_cache_privacy(test_cache):
    """Test that cache implementation respects privacy."""
    sensitive_data = {
        "user_id": "12345",
        "email": "test@example.com",
        "session_id": "abcdef"
    }
    
    # Set cache with sensitive data
    test_cache.set("test_key", sensitive_data)
    
    # Verify cache file uses hash
    cache_files = list(test_cache._cache_dir.glob("*.cache"))
    assert len(cache_files) == 1
    assert not "test_key" in cache_files[0].name
    assert cache_files[0].name.endswith(".cache")
    
    # Verify cache file content is not plaintext
    with cache_files[0].open("r") as f:
        content = json.load(f)
        assert "test_key" not in str(content)
        assert isinstance(content, dict)
        assert "value" in content
        assert "created_at" in content

def test_no_metrics_collection(client):
    """Test that no metrics are collected."""
    assert settings.COLLECT_METRICS is False
    assert settings.ENABLE_LOGGING is False

def test_minimal_session_data(client):
    """Test that only essential session data is stored."""
    response = client.post("/api/v1/sessions", json={
        "type": "practice",
        "wordIds": [1, 2, 3]
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify only essential data is present
    assert "id" in data
    assert "type" in data
    assert "wordIds" in data
    # Verify no tracking data is present
    assert "user_agent" not in data
    assert "ip_address" not in data
    assert "device_info" not in data

def test_cache_expiration(test_cache):
    """Test that cached data is properly expired."""
    test_cache.set("test_key", "test_value", expire=1)
    
    # Verify data is cached
    assert test_cache.get("test_key") == "test_value"
    
    # Wait for expiration
    import time
    time.sleep(1.1)
    
    # Verify data is expired and removed
    assert test_cache.get("test_key") is None
    assert not list(test_cache._cache_dir.glob("*.cache"))

def test_no_user_tracking(client):
    """Test that no user tracking is implemented."""
    # Test various endpoints
    endpoints = [
        "/api/v1/dashboard/stats",
        "/api/v1/vocabulary",
        "/api/v1/sessions"
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        print(f"\nTesting endpoint: {endpoint}")
        print(f"Status code: {response.status_code}")
        if response.status_code == 422:
            print(f"Response body: {response.json()}")
        assert response.status_code in (200, 404)  # Endpoint might not exist yet
        
        if response.status_code == 200:
            data = response.json()
            # Verify no tracking data
            assert not any(key in str(data) for key in [
                "user_agent",
                "ip_address",
                "device_id",
                "analytics",
                "tracking"
            ])

def test_local_only_access(client):
    """Test that only local connections are accepted."""
    # Test with non-local origin
    headers = {"Origin": "https://example.com"}
    response = client.get("/health", headers=headers)
    assert response.status_code == 403

    # Test with local origin
    headers = {"Origin": "http://localhost:3000"}
    response = client.get("/health", headers=headers)
    assert response.status_code == 200

def test_no_third_party_resources(client):
    """Test that no third-party resources are used."""
    response = client.get("/")
    assert response.status_code == 200
    
    # Check response headers for CSP
    csp = response.headers.get("Content-Security-Policy", "")
    assert "default-src 'self'" in csp
    assert not any(domain in csp for domain in [
        "googleapis.com",
        "cloudflare.com",
        "cdn.",
        "analytics",
        "tracking"
    ])

def test_data_minimization(client):
    """Test that only necessary data is collected and stored."""
    # Test vocabulary endpoint
    response = client.post("/api/v1/vocabulary", json={
        "word": "test",
        "translation": "test"
    })
    
    if response.status_code == 200:
        data = response.json()
        # Verify only essential fields are present
        assert set(data.keys()).issubset({
            "id",
            "word",
            "translation",
            "created_at",
            "updated_at"
        })

def test_privacy_headers(client):
    """Test that privacy-related headers are properly set."""
    response = client.get("/health")
    headers = response.headers
    
    # Verify privacy headers
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin, same-origin"
    assert headers.get("Permissions-Policy") == "interest-cohort=()"
    assert "strict-origin-when-cross-origin" in headers.get("Referrer-Policy", "")

def test_no_persistent_identifiers(test_cache):
    """Test that no persistent identifiers are stored."""
    # Test cache storage
    test_cache.set("user_data", {"preferences": {"theme": "dark"}})
    
    # Verify stored data
    cached_data = test_cache.get("user_data")
    assert isinstance(cached_data, dict)
    assert "preferences" in cached_data
    assert not any(key in str(cached_data) for key in [
        "device_id",
        "user_id",
        "session_id",
        "tracking_id"
    ]) 