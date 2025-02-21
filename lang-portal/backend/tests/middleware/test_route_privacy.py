"""Tests for the route-specific privacy middleware."""
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.middleware.route_privacy import RoutePrivacyMiddleware
import pytest
import json

@pytest.fixture
def app():
    """Create a test FastAPI application with RoutePrivacyMiddleware."""
    app = FastAPI()
    app.add_middleware(RoutePrivacyMiddleware)
    
    @app.get("/api/v1/dashboard/stats")
    async def dashboard_stats():
        return {
            "id": 123,
            "created_at": "2024-03-15T10:00:00Z",
            "ip": "192.168.1.1",
            "stats": {"total": 100}
        }
    
    @app.get("/api/v1/vocabulary/list")
    async def vocabulary_list():
        return {
            "items": [
                {
                    "id": 456,
                    "token": "secret-token",
                    "word": "hello"
                }
            ]
        }
    
    @app.get("/api/v1/sessions/current")
    async def current_session():
        return {
            "session_id": "abc123",
            "user_agent": "test-browser",
            "created_at": "2024-03-15T10:00:00Z"
        }
    
    return app

@pytest.fixture
def client(app):
    """Create a test client."""
    return TestClient(app)

def test_dashboard_route_privacy(client):
    """Test privacy rules for dashboard routes."""
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    
    # Check headers
    assert response.headers["cache-control"] == "no-store, max-age=0"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    
    # Check response sanitization
    data = response.json()
    assert data["id"] == "[ID]"
    assert data["created_at"] == "[TIMESTAMP]"
    assert data["ip"] == "[REDACTED]"
    assert data["stats"]["total"] == 100  # Non-sensitive data preserved

def test_vocabulary_route_privacy(client):
    """Test privacy rules for vocabulary routes."""
    # Test with allowed query parameters
    response = client.get("/api/v1/vocabulary/list?limit=10&sort=asc")
    assert response.status_code == 200
    
    # Test with disallowed query parameters
    response = client.get("/api/v1/vocabulary/list?token=123")
    assert response.status_code == 400
    assert "Invalid query parameters" in response.text
    
    # Check response sanitization
    data = response.json()
    assert data["items"][0]["id"] == "[ID]"
    assert data["items"][0]["token"] == "[REDACTED]"
    assert data["items"][0]["word"] == "hello"  # Non-sensitive data preserved

def test_session_route_privacy(client):
    """Test privacy rules for session routes."""
    response = client.get("/api/v1/sessions/current")
    assert response.status_code == 200
    
    # Check headers
    assert "no-store" in response.headers["cache-control"]
    assert "no-cache" in response.headers["cache-control"]
    
    # Check response sanitization
    data = response.json()
    assert data["session_id"] == "[REDACTED]"
    assert data["user_agent"] == "[REDACTED]"
    assert data["created_at"] == "[TIMESTAMP]"

def test_options_request_handling(client):
    """Test handling of OPTIONS requests."""
    response = client.options("/api/v1/dashboard/stats")
    assert response.status_code == 204
    
    # Check CORS headers
    assert "GET" in response.headers["access-control-allow-methods"]
    assert response.headers["access-control-max-age"] == "600"
    assert "Origin" in response.headers["vary"]

def test_unknown_route_privacy(client):
    """Test privacy rules for unknown routes."""
    response = client.get("/api/v1/unknown/endpoint")
    assert response.status_code == 404
    
    # Check default privacy headers
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["permissions-policy"] != ""

def test_development_mode_headers(client, monkeypatch):
    """Test development mode specific headers."""
    # Test development mode
    monkeypatch.setenv("DEV_MODE", "true")
    response = client.get("/api/v1/dashboard/stats")
    assert response.headers["x-privacy-mode"] == "development"
    assert response.headers["x-cache-status"] == "bypass"
    
    # Test production mode
    monkeypatch.setenv("DEV_MODE", "")
    response = client.get("/api/v1/dashboard/stats")
    assert response.headers["x-privacy-mode"] == "strict"
    assert "x-cache-status" not in response.headers

def test_permissions_policy_header(client):
    """Test comprehensive permissions policy header."""
    response = client.get("/api/v1/dashboard/stats")
    policy = response.headers["permissions-policy"]
    
    # Check for key permissions being restricted
    assert "camera=()" in policy
    assert "geolocation=()" in policy
    assert "microphone=()" in policy
    assert "payment=()" in policy
    
    # Check for newer privacy-related permissions
    assert "interest-cohort=()" in policy
    assert "web-share=()" in policy 