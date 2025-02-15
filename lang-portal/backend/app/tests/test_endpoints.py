import pytest
from datetime import datetime
from app.tests.schemas import ProgressResponseSchema, ProgressUpdateSchema

def test_create_progress(client, test_data, db_session):
    vocab = test_data["vocabulary"]
    db_session.add(vocab)
    db_session.refresh(vocab)
    
    update = ProgressUpdateSchema(correct=True)
    response = client.post(
        f"/api/v1/vocabulary/{vocab.id}/progress",
        json=update.model_dump()
    )
    assert response.status_code == 200
    ProgressResponseSchema.model_validate(response.json())

def test_get_vocabulary_statistics(client, test_data, db_session):
    vocab = test_data["vocabulary"]
    db_session.add(vocab)
    db_session.refresh(vocab)
    
    # First create some progress
    client.post(f"/api/v1/vocabulary/{vocab.id}/progress", json={"correct": True})
    client.post(f"/api/v1/vocabulary/{vocab.id}/progress", json={"correct": False})
    
    response = client.get(f"/api/v1/statistics/vocabulary/{vocab.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["word"] == "hello"
    assert data["translation"] == "hola"
    assert data["correct_attempts"] == 1
    assert data["incorrect_attempts"] == 1
    assert data["success_rate"] == 50.0

def test_get_group_statistics(client, test_data, db_session):
    group = test_data["group"]
    vocab = test_data["vocabulary"]
    db_session.add(group)
    db_session.add(vocab)
    db_session.refresh(group)
    db_session.refresh(vocab)
    
    # Create progress for vocabulary in group
    client.post(f"/api/v1/vocabulary/{vocab.id}/progress", json={"correct": True})
    
    response = client.get(f"/api/v1/statistics/group/{group.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Group"
    assert data["total_vocabulary"] == 1
    assert data["average_success_rate"] == 100.0

def test_get_overall_statistics(client, test_data, db_session):
    vocab = test_data["vocabulary"]
    db_session.add(vocab)
    db_session.refresh(vocab)
    
    # Create some progress
    client.post(f"/api/v1/vocabulary/{vocab.id}/progress", json={"correct": True})
    
    response = client.get("/api/v1/statistics/overall")
    assert response.status_code == 200
    data = response.json()
    assert data["total_vocabulary"] == 1
    assert data["vocabulary_started"] == 1
    assert len(data["recent_activity"]) == 1 