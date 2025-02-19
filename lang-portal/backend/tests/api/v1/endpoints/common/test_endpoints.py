import pytest
from datetime import datetime
from tests.utils.fixtures.test_data import ProgressResponseSchema, ProgressUpdateSchema

def test_create_progress(client, test_data, db_session):
    vocab = test_data["vocabulary"]
    db_session.add(vocab)
    db_session.refresh(vocab)
    
    response = client.post(
        f"/api/v1/vocabulary/{vocab.id}/progress",
        json={"correct_attempts": 1, "incorrect_attempts": 0}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["correct_attempts"] == 1
    assert data["incorrect_attempts"] == 0

def test_get_vocabulary_statistics(client, test_data, db_session):
    vocab = test_data["vocabulary"]
    db_session.add(vocab)
    db_session.refresh(vocab)
    
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

def test_get_group_statistics(client, test_data, db_session):
    group = test_data["group"]
    vocab = test_data["vocabulary"]
    db_session.add(group)
    db_session.add(vocab)
    db_session.refresh(group)
    db_session.refresh(vocab)
    
    # Create progress for vocabulary in group
    client.post(
        f"/api/v1/vocabulary/{vocab.id}/progress",
        json={"correct_attempts": 8, "incorrect_attempts": 2}
    )
    
    response = client.get(f"/api/v1/statistics/group/{group.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total_vocabulary"] > 0
    assert data["average_success_rate"] > 0

def test_get_overall_statistics(client, test_data, db_session):
    vocab = test_data["vocabulary"]
    db_session.add(vocab)
    db_session.refresh(vocab)
    
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