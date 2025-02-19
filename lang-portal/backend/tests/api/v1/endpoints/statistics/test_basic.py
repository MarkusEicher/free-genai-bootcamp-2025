import pytest
from fastapi.testclient import TestClient
from tests.api.v1.endpoints.common.fixtures.test_data import test_base_data
from app.main import app

def test_get_vocabulary_statistics(client, test_base_data, db_session):
    """Test getting statistics for a vocabulary item."""
    vocab = test_base_data["vocabulary"][0]
    
    # Create progress
    client.post(
        f"/api/v1/vocabulary/{vocab.id}/progress",
        json={"correct_attempts": 1, "incorrect_attempts": 0}
    )
    
    response = client.get(f"/api/v1/statistics/vocabulary/{vocab.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["correct_attempts"] == 1
    assert data["success_rate"] > 0

def test_get_overall_statistics(client, test_base_data, db_session):
    """Test getting overall statistics."""
    vocab = test_base_data["vocabulary"][0]
    
    # Create some progress
    client.post(
        f"/api/v1/vocabulary/{vocab.id}/progress",
        json={"correct_attempts": 5, "incorrect_attempts": 1}
    )
    
    response = client.get("/api/v1/statistics/overall")
    assert response.status_code == 200
    data = response.json()
    assert data["total_vocabulary"] > 0
    assert data["vocabulary_started"] > 0
    assert data["average_success_rate"] > 0