import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.language import Language

client = TestClient(app)

def test_list_languages(client):
    response = client.get("/api/v1/languages/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_language(client, db_session):
    # Clear any existing languages first
    db_session.query(Language).delete()
    db_session.commit()
    
    response = client.post(
        "/api/v1/languages/",
        json={"code": "es", "name": "Spanish"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "es"
    assert data["name"] == "Spanish"
    assert "id" in data

def test_create_language_duplicate_code(client, db_session):
    # First creation
    response = client.post(
        "/api/v1/languages/",
        json={"code": "it", "name": "Italian"}
    )
    assert response.status_code == 200

    # Try duplicate
    response = client.post(
        "/api/v1/languages/",
        json={"code": "it", "name": "Italiano"}
    )
    assert response.status_code == 400
    assert "Language with this code already exists" in response.json()["detail"]

def test_create_language_invalid_code(client, db_session):
    response = client.post(
        "/api/v1/languages/",
        json={"code": "toolong", "name": "Invalid"}
    )
    assert response.status_code == 422
    error_detail = response.json()["detail"][0]
    assert error_detail["type"] == "string_too_long"
    assert error_detail["loc"] == ["body", "code"]

def test_get_language(client, db_session):
    # Create a language first
    response = client.post(
        "/api/v1/languages/",
        json={"code": "es", "name": "Spanish"}
    )
    created = response.json()
    
    response = client.get(f"/api/v1/languages/{created['id']}")
    assert response.status_code == 200
    assert response.json()["code"] == "es"

def test_update_language(client, db_session):
    # Create a language first
    response = client.post(
        "/api/v1/languages/",
        json={"code": "es", "name": "Spanish"}
    )
    created = response.json()
    
    # Then update it
    response = client.put(
        f"/api/v1/languages/{created['id']}",
        json={"name": "Spanish Updated"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Spanish Updated"

def test_update_language_validation(client, db_session):
    # Create a language first
    response = client.post(
        "/api/v1/languages/",
        json={"code": "es", "name": "Spanish"}
    )
    created = response.json()
    
    # Try empty name
    response = client.put(
        f"/api/v1/languages/{created['id']}",
        json={"name": ""}
    )
    assert response.status_code == 422
    data = response.json()
    assert data["detail"][0]["type"] == "string_too_short"

def test_delete_language(client, db_session):
    # Create a language first
    response = client.post(
        "/api/v1/languages/",
        json={"code": "es", "name": "Spanish"}
    )
    created = response.json()
    
    # Delete it
    response = client.delete(f"/api/v1/languages/{created['id']}")
    assert response.status_code == 200
    
    # Verify it's deleted
    response = client.get(f"/api/v1/languages/{created['id']}")
    assert response.status_code == 404

def test_list_languages_pagination(client, db_session):
    # Create multiple languages
    for code in ["de", "fr", "es"]:
        client.post(
            "/api/v1/languages/",
            json={"code": code, "name": f"Test {code}"}
        )
    
    # Test pagination
    response = client.get("/api/v1/languages/?skip=1&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2