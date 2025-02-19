import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_language_pair(client, test_language):
    # Create target language
    response = client.post(
        "/api/v1/languages/",
        json={"code": "es", "name": "Spanish"}
    )
    target_id = response.json()["id"]

    # Create language pair
    response = client.post(
        "/api/v1/language-pairs/",
        json={
            "source_language_id": test_language.id,
            "target_language_id": target_id
        }
    )
    assert response.status_code == 200
    return response.json()

def test_create_language_pair_same_language(client, test_language):
    response = client.post(
        "/api/v1/language-pairs/",
        json={
            "source_language_id": test_language.id,
            "target_language_id": test_language.id
        }
    )
    assert response.status_code == 400
    assert "Source and target languages must be different" in response.json()["detail"]

def test_create_language_pair_invalid_language(client, test_language):
    response = client.post(
        "/api/v1/language-pairs/",
        json={
            "source_language_id": test_language.id,
            "target_language_id": 999  # Non-existent language
        }
    )
    assert response.status_code == 404

def test_list_language_pairs_by_language(client, test_language_pair):
    response = client.get(f"/api/v1/language-pairs/?source_language_id={test_language_pair.source_language_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all(pair["source_language_id"] == test_language_pair.source_language_id for pair in data)

def test_get_language_pair(client, test_language_pair):
    response = client.get(f"/api/v1/language-pairs/{test_language_pair.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["source_language_id"] == test_language_pair.source_language_id
    assert data["target_language_id"] == test_language_pair.target_language_id

def test_get_language_pair_not_found(client):
    response = client.get("/api/v1/language-pairs/999")
    assert response.status_code == 404

def test_create_language_pair_duplicate(client, test_language_pair):
    # Try to create same pair again
    response = client.post(
        "/api/v1/language-pairs/",
        json={
            "source_language_id": test_language_pair.source_language_id,
            "target_language_id": test_language_pair.target_language_id
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_delete_language_pair(client, test_language_pair):
    response = client.delete(f"/api/v1/language-pairs/{test_language_pair.id}")
    assert response.status_code == 200
    
    # Verify deletion
    response = client.get(f"/api/v1/language-pairs/{test_language_pair.id}")
    assert response.status_code == 404

def test_list_language_pairs_pagination(client, test_language_pair, test_language):
    # Create additional target languages and pairs
    target_languages = []
    for code in ['es', 'fr', 'it']:
        response = client.post(
            "/api/v1/languages/",
            json={"code": code, "name": f"Test {code}"}
        )
        assert response.status_code == 200
        target_languages.append(response.json())
    
    # Create language pairs with the new target languages
    for target in target_languages:
        response = client.post(
            "/api/v1/language-pairs/",
            json={
                "source_language_id": test_language.id,
                "target_language_id": target["id"]
            }
        )
        assert response.status_code == 200
    
    # Test pagination
    response = client.get("/api/v1/language-pairs/?skip=1&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2
    assert all("id" in pair for pair in data)