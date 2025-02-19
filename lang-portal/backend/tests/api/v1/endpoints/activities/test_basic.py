import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, UTC

from app.models.activity import Activity, Session as ActivitySession
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary

def test_create_activity(client: TestClient, test_base_data, db_session: Session):
    """Test creating an activity with vocabulary groups."""
    # Create vocabulary group
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_base_data["language_pair"].id
    )
    group.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group)
    db_session.commit()

    response = client.post(
        "/api/v1/activities",
        json={
            "type": "flashcard",
            "name": "Test Activity",
            "description": "Test Description",
            "vocabulary_group_ids": [group.id],
            "practice_direction": "forward"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Activity"
    assert data["type"] == "flashcard"
    assert len(data["vocabulary_groups"]) == 1
    assert data["vocabulary_groups"][0]["id"] == group.id

def test_create_activity_without_group(client: TestClient):
    """Test creating an activity without vocabulary groups."""
    response = client.post(
        "/api/v1/activities",
        json={
            "type": "flashcard",
            "name": "Test Activity",
            "description": "Test Description",
            "vocabulary_group_ids": [],
            "practice_direction": "forward"
        }
    )
    assert response.status_code == 400
    assert "at least one vocabulary group" in response.json()["detail"]["message"]

def test_get_activity(client: TestClient, test_base_data, db_session: Session):
    """Test getting activity details."""
    # Create group and activity
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_base_data["language_pair"].id
    )
    group.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group)
    db_session.commit()

    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == activity.name
    assert len(data["vocabulary_groups"]) == 1
    assert data["vocabulary_groups"][0]["id"] == group.id

def test_list_activities(client: TestClient, test_base_data, db_session: Session):
    """Test listing activities."""
    # Create multiple groups and activities
    activities = []
    for i in range(3):
        group = VocabularyGroup(
            name=f"Group {i}",
            description=f"Description {i}",
            language_pair_id=test_base_data["language_pair"].id
        )
        group.vocabularies.extend(test_base_data["vocabulary"])
        db_session.add(group)
        db_session.commit()

        activity = Activity(
            type="flashcard",
            name=f"Activity {i}",
            description=f"Description {i}",
            practice_direction="forward"
        )
        activity.vocabulary_groups.append(group)
        activities.append(activity)
    
    db_session.add_all(activities)
    db_session.commit()

    response = client.get("/api/v1/activities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert all(a["vocabulary_groups"] for a in data)  # All have groups

def test_update_activity(client: TestClient, test_base_data, db_session: Session):
    """Test updating activity details and groups."""
    # Create initial group and activity
    group1 = VocabularyGroup(
        name="Group 1",
        description="Description 1",
        language_pair_id=test_base_data["language_pair"].id
    )
    group1.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group1)
    db_session.commit()

    activity = Activity(
        type="flashcard",
        name="Original Name",
        description="Original Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(group1)
    db_session.add(activity)
    db_session.commit()

    # Create another group
    group2 = VocabularyGroup(
        name="Group 2",
        description="Description 2",
        language_pair_id=test_base_data["language_pair"].id
    )
    group2.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group2)
    db_session.commit()

    # Update activity
    response = client.put(
        f"/api/v1/activities/{activity.id}",
        json={
            "name": "Updated Name",
            "vocabulary_group_ids": [group1.id, group2.id],
            "practice_direction": "reverse"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert len(data["vocabulary_groups"]) == 2
    assert data["practice_direction"] == "reverse"

def test_delete_activity(client: TestClient, test_base_data, db_session: Session):
    """Test deleting an activity."""
    # Create group and activity
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_base_data["language_pair"].id
    )
    group.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group)
    db_session.commit()

    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    # Create a session
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Delete activity
    response = client.delete(f"/api/v1/activities/{activity.id}")
    assert response.status_code == 200

    # Verify activity and session are deleted but group remains
    assert db_session.get(Activity, activity.id) is None
    assert db_session.get(ActivitySession, session.id) is None
    assert db_session.get(VocabularyGroup, group.id) is not None

def test_get_practice_vocabulary(client: TestClient, test_base_data, db_session: Session):
    """Test getting practice vocabulary from activity."""
    # Create group and activity
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_base_data["language_pair"].id
    )
    group.vocabularies.extend(test_base_data["vocabulary"])
    db_session.add(group)
    db_session.commit()

    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}/practice")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == len(test_base_data["vocabulary"])
    assert all(
        "word" in item and "translation" in item and "vocabulary_id" in item
        for item in data["items"]
    ) 