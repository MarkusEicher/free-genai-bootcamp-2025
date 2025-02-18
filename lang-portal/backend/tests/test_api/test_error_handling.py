import pytest
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError, OperationalError
from app.main import app
from app.core.config import settings
from datetime import datetime, UTC

def test_404_not_found():
    """Test 404 error handling."""
    client = TestClient(app)
    response = client.get("/api/v1/nonexistent-endpoint")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], str)

def test_405_method_not_allowed():
    """Test 405 error handling."""
    client = TestClient(app)
    response = client.put("/api/v1/dashboard/stats")  # Only GET is allowed
    assert response.status_code == 405
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], str)

def test_422_validation_error():
    """Test validation error handling."""
    client = TestClient(app)
    
    # Test invalid activity creation
    invalid_data = {
        "type": "",  # Empty type is not allowed
        "name": "Test Activity"
    }
    response = client.post("/api/v1/activities", json=invalid_data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert len(data["detail"]) > 0
    assert "type" in str(data["detail"])

def test_400_bad_request():
    """Test bad request error handling."""
    client = TestClient(app)
    
    # Test invalid JSON
    response = client.post(
        "/api/v1/activities",
        headers={"Content-Type": "application/json"},
        content="invalid json"
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], str)

def test_413_request_entity_too_large():
    """Test request entity too large error handling."""
    client = TestClient(app)
    
    # Create large payload
    large_data = {
        "type": "flashcard",
        "name": "Test Activity",
        "description": "x" * 1_000_000  # Very large description
    }
    response = client.post("/api/v1/activities", json=large_data)
    assert response.status_code in [413, 422]  # Either too large or validation error

def test_database_error_handling():
    """Test database error handling."""
    client = TestClient(app)
    
    # Test duplicate language code (unique constraint)
    language_data = {
        "code": "en",
        "name": "English"
    }
    # First creation should succeed
    response1 = client.post("/api/v1/languages", json=language_data)
    assert response1.status_code == 200
    
    # Second creation should fail with 400
    response2 = client.post("/api/v1/languages", json=language_data)
    assert response2.status_code == 400
    data = response2.json()
    assert "detail" in data
    assert isinstance(data["detail"], dict)
    assert "code" in data["detail"]

def test_invalid_id_parameter():
    """Test invalid ID parameter handling."""
    client = TestClient(app)
    
    # Test invalid activity ID
    response = client.get("/api/v1/activities/invalid")
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert any("type_error" in error["type"] for error in data["detail"])

def test_invalid_query_parameters():
    """Test invalid query parameter handling."""
    client = TestClient(app)
    
    # Test invalid pagination parameters
    response = client.get("/api/v1/activities?limit=invalid")
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert any("type_error" in error["type"] for error in data["detail"])

def test_invalid_date_format():
    """Test invalid date format handling."""
    client = TestClient(app)
    
    # Test invalid session creation with wrong date format
    session_data = {
        "start_time": "invalid-date",
        "end_time": None
    }
    response = client.post("/api/v1/activities/1/sessions", json=session_data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("invalid datetime format" in str(error["msg"]).lower() 
              for error in data["detail"])

def test_missing_required_fields():
    """Test missing required fields handling."""
    client = TestClient(app)
    
    # Test vocabulary creation without required fields
    vocab_data = {
        "word": "test"  # Missing translation and language_pair_id
    }
    response = client.post("/api/v1/vocabularies", json=vocab_data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("field required" in str(error["msg"]).lower() 
              for error in data["detail"])

def test_invalid_relationship_ids():
    """Test invalid relationship ID handling."""
    client = TestClient(app)
    
    # Test vocabulary creation with non-existent language pair
    vocab_data = {
        "word": "test",
        "translation": "test",
        "language_pair_id": 999999  # Non-existent ID
    }
    response = client.post("/api/v1/vocabularies", json=vocab_data)
    assert response.status_code in [400, 404]
    data = response.json()
    assert "detail" in data

def test_invalid_enum_values():
    """Test invalid enum value handling."""
    client = TestClient(app)
    
    # Test activity creation with invalid type
    activity_data = {
        "type": "invalid_type",  # Invalid activity type
        "name": "Test Activity"
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("type" in str(error["loc"]).lower() for error in data["detail"])

def test_invalid_numeric_ranges():
    """Test invalid numeric range handling."""
    client = TestClient(app)
    
    # Test session attempt with invalid response time
    attempt_data = {
        "vocabulary_id": 1,
        "is_correct": True,
        "response_time_ms": -1  # Invalid negative time
    }
    response = client.post("/api/v1/sessions/1/attempts", json=attempt_data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any("response_time_ms" in str(error["loc"]) for error in data["detail"])

def test_cascade_deletion_handling():
    """Test cascade deletion error handling."""
    client = TestClient(app)
    
    # Create test data
    language_data = {
        "code": "test",
        "name": "Test Language"
    }
    lang_response = client.post("/api/v1/languages", json=language_data)
    assert lang_response.status_code == 200
    language_id = lang_response.json()["id"]
    
    # Try to delete language that might have dependencies
    response = client.delete(f"/api/v1/languages/{language_id}")
    assert response.status_code in [200, 400]  # Either success or error if has dependencies
    if response.status_code == 400:
        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], dict)

def test_transaction_rollback():
    """Test transaction rollback on error."""
    client = TestClient(app)
    
    # Test partial failure in bulk operation
    vocab_data_list = [
        {
            "word": "test1",
            "translation": "test1",
            "language_pair_id": 1
        },
        {
            "word": "test1",  # Duplicate word
            "translation": "test2",
            "language_pair_id": 1
        }
    ]
    response = client.post("/api/v1/vocabularies/bulk", json=vocab_data_list)
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    
    # Verify no partial data was saved
    response = client.get("/api/v1/vocabularies")
    assert "test1" not in str(response.json())

def test_error_response_format():
    """Test error response format consistency."""
    client = TestClient(app)
    
    # Test various error endpoints
    endpoints = [
        "/api/v1/activities/999999",  # Not found
        "/api/v1/activities?limit=invalid",  # Validation error
        "/api/v1/activities",  # Method not allowed (PUT)
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code >= 400
        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], (str, list, dict)) 