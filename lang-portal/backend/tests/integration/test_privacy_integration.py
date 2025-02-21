"""Integration tests for privacy features across the application."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import json
import re
from datetime import datetime, timedelta

from app.main import app
from app.core.config import settings
from app.db.database import get_db
from tests.privacy_config import (
    TEST_DATA,
    SENSITIVE_PATTERNS,
    SANITIZED_VALUES,
    ROUTE_CACHE_SETTINGS,
    FORBIDDEN_HEADERS,
    contains_sensitive_data,
    verify_cache_settings,
    verify_security_headers
)

@pytest.fixture(scope="module")
def client():
    """Create a test client."""
    with TestClient(app) as client:
        yield client

@pytest.fixture(scope="function")
def db_session(test_engine):
    """Create a test database session."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def test_data(db_session):
    """Set up test data in the database."""
    # Create test vocabulary groups
    vocab_group = {
        "name": "Test Group",
        "description": "Test vocabulary group"
    }
    db_session.execute(
        "INSERT INTO vocabulary_groups (name, description) VALUES (:name, :description)",
        vocab_group
    )
    
    # Create test activities
    activity = {
        "type": "practice",
        "name": "Test Activity",
        "description": "Test activity description",
        "practice_direction": "forward"
    }
    db_session.execute(
        """
        INSERT INTO activities (type, name, description, practice_direction)
        VALUES (:type, :name, :description, :practice_direction)
        """,
        activity
    )
    
    db_session.commit()
    return {"vocab_group": vocab_group, "activity": activity}

@pytest.mark.integration
@pytest.mark.privacy
class TestPrivacyIntegration:
    """Integration tests for privacy features."""
    
    def test_external_access_blocked(self, client):
        """Test that external access is blocked."""
        # Try to access with external origin
        headers = {"Origin": "https://example.com"}
        response = client.get("/api/v1/dashboard/stats", headers=headers)
        assert response.status_code == 403
        assert "local use only" in response.text.lower()
        
        # Try to access with external referer
        headers = {"Referer": "https://example.com"}
        response = client.get("/api/v1/dashboard/stats", headers=headers)
        assert response.status_code == 403
    
    def test_sensitive_data_sanitization_chain(self, client, test_data):
        """Test that sensitive data is sanitized through the entire chain."""
        # Create test session with sensitive data
        session_data = {
            "activity_id": 1,
            "user_agent": "Test Browser 1.0",
            "ip_address": "192.168.1.1",
            "client_id": "test123"
        }
        response = client.post("/api/v1/sessions/", json=session_data)
        assert response.status_code == 200
        
        # Verify response is sanitized
        data = response.json()
        assert not contains_sensitive_data(json.dumps(data))
        
        # Get session and verify it's sanitized
        session_id = data["id"]
        response = client.get(f"/api/v1/sessions/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert not contains_sensitive_data(json.dumps(data))
        
        # Check cache
        response = client.get(f"/api/v1/sessions/{session_id}")
        assert response.status_code == 200
        cached_data = response.json()
        assert not contains_sensitive_data(json.dumps(cached_data))
    
    def test_route_specific_privacy_rules(self, client):
        """Test that route-specific privacy rules are applied correctly."""
        routes = {
            "dashboard": "/api/v1/dashboard/stats",
            "vocabulary": "/api/v1/vocabulary/list",
            "sessions": "/api/v1/sessions/current",
            "activities": "/api/v1/activities/list"
        }
        
        for route_type, path in routes.items():
            # Test with allowed parameters
            params = "&".join(f"{param}=test" for param in 
                            ROUTE_CACHE_SETTINGS[route_type]["allowed_params"])
            response = client.get(f"{path}?{params}")
            assert response.status_code != 400
            
            # Test with forbidden parameter
            response = client.get(f"{path}?token=secret")
            assert response.status_code == 400
            
            # Verify cache settings
            assert verify_cache_settings(route_type, response.headers)
    
    def test_privacy_headers_consistency(self, client):
        """Test that privacy headers are consistent across all routes."""
        test_paths = [
            "/api/v1/dashboard/stats",
            "/api/v1/vocabulary/list",
            "/api/v1/sessions/current",
            "/api/v1/activities/list",
            "/health",
            "/docs"  # Should be blocked in production
        ]
        
        for path in test_paths:
            response = client.get(path)
            missing_headers = verify_security_headers(response.headers)
            assert not missing_headers, f"Missing headers for {path}: {missing_headers}"
    
    @pytest.mark.asyncio
    async def test_cache_privacy_lifecycle(self, client, test_data):
        """Test privacy throughout the cache lifecycle."""
        # Create data that should be cached
        response = client.get("/api/v1/vocabulary/list")
        assert response.status_code == 200
        initial_data = response.json()
        
        # Get cached data
        response = client.get("/api/v1/vocabulary/list")
        assert response.status_code == 200
        cached_data = response.json()
        
        # Verify both responses are sanitized
        assert not contains_sensitive_data(json.dumps(initial_data))
        assert not contains_sensitive_data(json.dumps(cached_data))
        
        # Verify cache headers
        assert verify_cache_settings("vocabulary", response.headers)
        
        # Modify data and verify cache invalidation
        response = client.post("/api/v1/vocabulary/", 
                             json={"word": "test", "translation": "test"})
        assert response.status_code == 200
        
        # Get data again and verify it's still sanitized
        response = client.get("/api/v1/vocabulary/list")
        assert response.status_code == 200
        new_data = response.json()
        assert not contains_sensitive_data(json.dumps(new_data))
    
    def test_error_response_privacy(self, client):
        """Test that error responses maintain privacy."""
        # Test 404 error
        response = client.get("/api/v1/not-found")
        assert response.status_code == 404
        assert verify_security_headers(response.headers) == []
        
        # Test validation error
        response = client.post("/api/v1/vocabulary/", json={})
        assert response.status_code == 422
        data = response.json()
        assert not contains_sensitive_data(json.dumps(data))
        
        # Test server error (500)
        with pytest.raises(Exception):
            client.get("/api/v1/error")
        # Verify error doesn't expose sensitive information
    
    def test_development_mode_restrictions(self, client):
        """Test that development mode doesn't bypass privacy."""
        # Try to access docs in production mode
        response = client.get("/docs")
        assert response.status_code in [404, 403]
        
        # Try to access OpenAPI schema
        response = client.get("/openapi.json")
        assert response.status_code in [404, 403]
        
        # Verify debug information is not exposed
        response = client.get("/api/v1/not-found")
        assert response.status_code == 404
        data = response.json()
        assert "traceback" not in data
        assert "debug" not in data
    
    def test_data_sanitization_patterns(self, client):
        """Test that all sensitive data patterns are properly sanitized."""
        # Create test data with all sensitive patterns
        test_data = {
            "user": {
                "id": 12345,
                "email": "test@example.com",
                "ip": "192.168.1.1",
                "session": "abc123",
                "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
            },
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "browser": "Test Browser",
                "client_id": "test456"
            }
        }
        
        # Send data through different endpoints
        endpoints = [
            ("/api/v1/sessions/", "POST"),
            ("/api/v1/activities/", "POST"),
            ("/api/v1/vocabulary/", "POST")
        ]
        
        for path, method in endpoints:
            response = client.request(method, path, json=test_data)
            assert response.status_code in [200, 201]
            data = response.json()
            
            # Verify each sensitive pattern is sanitized
            for pattern_name, pattern in SENSITIVE_PATTERNS.items():
                matches = pattern.findall(json.dumps(data))
                assert not matches, f"Found unsanitized {pattern_name} in response"
    
    def test_request_privacy(self, client):
        """Test privacy of request handling."""
        # Test query parameter filtering
        response = client.get("/api/v1/vocabulary/list?token=secret&limit=10")
        assert response.status_code == 400
        
        # Test header filtering
        headers = {
            "X-Real-IP": "192.168.1.1",
            "X-Forwarded-For": "192.168.1.1",
            "Cookie": "session=abc123"
        }
        response = client.get("/api/v1/vocabulary/list", headers=headers)
        assert response.status_code == 200
        
        # Verify no sensitive headers are reflected
        for header in headers:
            assert header not in response.headers
    
    def test_response_privacy(self, client):
        """Test privacy of response handling."""
        response = client.get("/api/v1/dashboard/stats")
        assert response.status_code == 200
        
        # Verify no sensitive headers
        for header in response.headers:
            assert header.lower() not in [h.lower() for h in FORBIDDEN_HEADERS]
        
        # Verify content type is safe
        assert response.headers["Content-Type"] == "application/json"
        
        # Verify no sensitive data in response
        data = response.json()
        assert not contains_sensitive_data(json.dumps(data)) 