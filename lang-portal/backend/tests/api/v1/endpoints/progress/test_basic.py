import pytest
from fastapi.testclient import TestClient
from tests.api.v1.endpoints.common.fixtures.test_data import test_base_data
from app.main import app

client = TestClient(app)

def test_create_progress(client, test_base_data, db_session):
    """Test creating progress for a vocabulary item."""
    vocab = test_base_data["vocabulary"][0]  # Get first vocabulary item
    
    response = client.post(
        f"/api/v1/vocabulary/{vocab.id}/progress",
        json={"correct_attempts": 1, "incorrect_attempts": 0}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["correct_attempts"] == 1
    assert data["incorrect_attempts"] == 0