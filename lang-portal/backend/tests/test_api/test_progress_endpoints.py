import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_progress(client, test_vocabulary):
    response = client.post(
        "/api/v1/progress/",
        json={
            "vocabulary_id": test_vocabulary.id,
            "correct_attempts": 1,
            "incorrect_attempts": 0,
            "mastered": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["vocabulary_id"] == test_vocabulary.id
    assert data["correct_attempts"] == 1

def test_get_progress(client, test_progress):
    response = client.get(f"/api/v1/progress/{test_progress.id}")
    assert response.status_code == 200
    assert response.json()["vocabulary_id"] == test_progress.vocabulary_id

def test_update_progress(client, test_vocabulary_with_progress):
    progress = test_vocabulary_with_progress.progress
    response = client.put(
        f"/api/v1/progress/{progress.id}",
        json={
            "correct_attempts": 8,
            "incorrect_attempts": 2,
            "mastered": True  # This should be valid since success rate > 80%
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["correct_attempts"] == 8
    assert data["incorrect_attempts"] == 2
    assert data["mastered"] is True

def test_create_progress_invalid_vocabulary(client, test_vocabulary):
    response = client.post(
        "/api/v1/progress/",
        json={
            "vocabulary_id": 999,  # Non-existent vocabulary
            "correct_attempts": 1,
            "incorrect_attempts": 0,
            "mastered": False
        }
    )
    assert response.status_code == 404

def test_update_progress_invalid_data(client, test_progress):
    response = client.put(
        f"/api/v1/progress/{test_progress.id}",
        json={
            "correct_attempts": -1  # Invalid negative number
        }
    )
    assert response.status_code == 422
    assert "greater than or equal to 0" in response.json()["detail"][0]["msg"]

def test_create_progress_invalid_attempts(client, test_vocabulary):
    response = client.post(
        "/api/v1/progress/",
        json={
            "vocabulary_id": test_vocabulary.id,
            "correct_attempts": -1,  # Invalid negative number
            "incorrect_attempts": 0,
            "mastered": False
        }
    )
    assert response.status_code == 422

def test_update_progress_inconsistent_state(client, test_progress):
    # Try to set mastered=True with no correct attempts
    response = client.put(
        f"/api/v1/progress/{test_progress.id}",
        json={
            "correct_attempts": 0,
            "mastered": True
        }
    )
    assert response.status_code == 422