import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_vocabulary_group(client, test_language_pair):
    response = client.post(
        "/api/v1/vocabulary-groups/",
        json={
            "name": "Basic Phrases",
            "description": "Common everyday phrases",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Basic Phrases"
    return data

def test_get_vocabulary_group(client, test_language_pair):
    created = test_create_vocabulary_group(client, test_language_pair)
    
    response = client.get(f"/api/v1/vocabulary-groups/{created['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Basic Phrases"

def test_update_vocabulary_group(client, test_language_pair):
    created = test_create_vocabulary_group(client, test_language_pair)
    
    response = client.put(
        f"/api/v1/vocabulary-groups/{created['id']}",
        json={"description": "Updated description"}
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"

def test_delete_vocabulary_group(client, test_language_pair):
    created = test_create_vocabulary_group(client, test_language_pair)
    
    response = client.delete(f"/api/v1/vocabulary-groups/{created['id']}")
    assert response.status_code == 200
    
    response = client.get(f"/api/v1/vocabulary-groups/{created['id']}")
    assert response.status_code == 404 

def test_get_vocabulary_group_not_found(client):
    response = client.get("/api/v1/vocabulary-groups/999")
    assert response.status_code == 404

def test_create_vocabulary_group_invalid_data(client, test_language_pair):
    response = client.post(
        "/api/v1/vocabulary-groups/",
        json={
            "name": "",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 422

def test_update_vocabulary_group_not_found(client):
    response = client.put(
        "/api/v1/vocabulary-groups/999",
        json={"name": "Updated Name"}
    )
    assert response.status_code == 404 

def test_create_vocabulary_group_duplicate_name(client, test_language_pair):
    # First creation
    response = client.post(
        "/api/v1/vocabulary-groups/",
        json={
            "name": "Test Group",
            "description": "Test",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 200

    # Try to create duplicate
    response = client.post(
        "/api/v1/vocabulary-groups/",
        json={
            "name": "Test Group",  # Same name
            "description": "Different",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 400

def test_update_vocabulary_group_validation(client, test_language_pair):
    created = test_create_vocabulary_group(client, test_language_pair)
    
    # Try to update with empty name
    response = client.put(
        f"/api/v1/vocabulary-groups/{created['id']}",
        json={"name": ""}
    )
    assert response.status_code == 422 