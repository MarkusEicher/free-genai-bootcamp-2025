import pytest
from datetime import datetime, UTC, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.activity import Activity, Session as ActivitySession
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.models.language import Language
from app.models.language_pair import LanguagePair

@pytest.fixture
def practice_setup(db_session: Session):
    """Create test data for practice tests."""
    # Create languages and pair
    source = db_session.query(Language).filter_by(code="en").first()
    if not source:
        source = Language(code="en", name="English")
        db_session.add(source)
    
    target = db_session.query(Language).filter_by(code="de").first()
    if not target:
        target = Language(code="de", name="German")
        db_session.add(target)
    
    db_session.commit()

    # Check if language pair exists
    pair = db_session.query(LanguagePair).filter_by(
        source_language_id=source.id,
        target_language_id=target.id
    ).first()
    
    if not pair:
        # Create language pair only if it doesn't exist
        pair = LanguagePair(
            source_language_id=source.id,
            target_language_id=target.id
        )
        db_session.add(pair)
        db_session.commit()

    # Create or get vocabulary groups
    group1 = db_session.query(VocabularyGroup).filter_by(
        name="Basic Verbs",
        language_pair_id=pair.id
    ).first()
    
    if not group1:
        group1 = VocabularyGroup(
            name="Basic Verbs",
            description="Common verbs for beginners",
            language_pair_id=pair.id
        )
        db_session.add(group1)
    
    group2 = db_session.query(VocabularyGroup).filter_by(
        name="Advanced Verbs",
        language_pair_id=pair.id
    ).first()
    
    if not group2:
        group2 = VocabularyGroup(
            name="Advanced Verbs",
            description="Advanced verb forms",
            language_pair_id=pair.id
        )
        db_session.add(group2)
    
    db_session.commit()

    # Create or get vocabulary items and associate with groups
    vocab_data = [
        ("run", "laufen", group1),
        ("walk", "gehen", group1),
        ("jump", "springen", group2),
        ("swim", "schwimmen", group2)
    ]
    vocabularies = []
    
    for word, translation, group in vocab_data:
        vocab = db_session.query(Vocabulary).filter_by(
            word=word,
            language_pair_id=pair.id
        ).first()
        
        if not vocab:
            vocab = Vocabulary(
                word=word,
                translation=translation,
                language_pair_id=pair.id
            )
            db_session.add(vocab)
            db_session.commit()
        
        vocabularies.append(vocab)
        
        # Add to group if not already there
        if vocab not in group.vocabularies:
            group.vocabularies.append(vocab)
    
    db_session.commit()

    # Verify associations
    db_session.refresh(group1)
    db_session.refresh(group2)
    
    # Log group contents for debugging
    print(f"Group 1 ({group1.name}) vocabularies: {[v.word for v in group1.vocabularies]}")
    print(f"Group 2 ({group2.name}) vocabularies: {[v.word for v in group2.vocabularies]}")

    return {
        "language_pair": pair,
        "groups": [group1, group2],
        "vocabularies": vocabularies
    }

def test_create_activity_with_multiple_groups(client: TestClient, db_session: Session, practice_setup):
    """Test creating activity with multiple vocabulary groups."""
    activity_data = {
        "type": "flashcard",
        "name": "Mixed Verbs",
        "description": "Practice both basic and advanced verbs",
        "vocabulary_group_ids": [group.id for group in practice_setup["groups"]],
        "practice_direction": "forward"
    }
    response = client.post("/api/v1/activities", json=activity_data)
    assert response.status_code == 200
    data = response.json()
    assert len(data["vocabulary_groups"]) == 2
    assert data["practice_direction"] == "forward"

def test_practice_vocabulary_forward(client: TestClient, db_session: Session, practice_setup):
    """Test getting practice vocabulary in forward direction."""
    # Create activity with first group
    activity = Activity(
        type="flashcard",
        name="Basic Practice",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(practice_setup["groups"][0])
    db_session.add(activity)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}/practice")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2  # Two words in first group
    # Verify word order in forward direction
    assert any(
        item["word"] == "run" and item["translation"] == "laufen"
        for item in data["items"]
    )

def test_practice_vocabulary_reverse(client: TestClient, db_session: Session, practice_setup):
    """Test getting practice vocabulary in reverse direction."""
    # Create activity with first group
    activity = Activity(
        type="flashcard",
        name="Reverse Practice",
        practice_direction="reverse"
    )
    activity.vocabulary_groups.append(practice_setup["groups"][0])
    db_session.add(activity)
    db_session.commit()

    response = client.get(f"/api/v1/activities/{activity.id}/practice")
    assert response.status_code == 200
    data = response.json()
    # Verify word order is reversed
    assert any(
        item["word"] == "laufen" and item["translation"] == "run"
        for item in data["items"]
    )

def test_practice_session_with_groups(client: TestClient, db_session: Session, practice_setup):
    """Test practice session with vocabulary from groups."""
    # Create activity with both groups
    activity = Activity(
        type="flashcard",
        name="Full Practice",
        practice_direction="forward"
    )
    for group in practice_setup["groups"]:
        activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    # Create session
    session_data = {
        "start_time": datetime.now(UTC).isoformat()
    }
    session_response = client.post(f"/api/v1/activities/{activity.id}/sessions", json=session_data)
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]

    # Record attempts for vocabulary from different groups
    for vocab in practice_setup["vocabularies"]:
        attempt_data = {
            "vocabulary_id": vocab.id,
            "is_correct": True,
            "response_time_ms": 1500
        }
        response = client.post(f"/api/v1/sessions/{session_id}/attempts", json=attempt_data)
        assert response.status_code == 200

def test_invalid_vocabulary_attempt(client: TestClient, db_session: Session, practice_setup):
    """Test attempt with vocabulary not in activity's groups."""
    # Create activity with only first group
    activity = Activity(
        type="flashcard",
        name="Basic Practice",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(practice_setup["groups"][0])
    db_session.add(activity)
    db_session.commit()

    # Create session
    session_data = {
        "start_time": datetime.now(UTC).isoformat()
    }
    session_response = client.post(f"/api/v1/activities/{activity.id}/sessions", json=session_data)
    session_id = session_response.json()["id"]

    # Try to record attempt with vocabulary from second group
    vocab_from_other_group = practice_setup["groups"][1].vocabularies[0]
    attempt_data = {
        "vocabulary_id": vocab_from_other_group.id,
        "is_correct": True,
        "response_time_ms": 1500
    }
    response = client.post(f"/api/v1/sessions/{session_id}/attempts", json=attempt_data)
    assert response.status_code == 400
    error_response = response.json()
    assert error_response["detail"]["code"] == "INVALID_VOCABULARY"
    assert "vocabulary does not belong" in error_response["detail"]["message"].lower()

def test_activity_progress_with_groups(client: TestClient, db_session: Session, practice_setup):
    """Test progress tracking for vocabulary from different groups."""
    # Create activity with both groups
    activity = Activity(
        type="flashcard",
        name="Full Practice",
        practice_direction="forward"
    )
    for group in practice_setup["groups"]:
        activity.vocabulary_groups.append(group)
    db_session.add(activity)
    db_session.commit()

    # Create session and record attempts
    session = ActivitySession(
        activity_id=activity.id,
        start_time=datetime.now(UTC)
    )
    db_session.add(session)
    db_session.commit()

    # Record mixed success for different vocabulary items
    for i, vocab in enumerate(practice_setup["vocabularies"]):
        attempt_data = {
            "vocabulary_id": vocab.id,
            "is_correct": i % 2 == 0,  # Alternate between correct and incorrect
            "response_time_ms": 1500
        }
        client.post(f"/api/v1/sessions/{session.id}/attempts", json=attempt_data)

    # Get progress
    response = client.get(f"/api/v1/activities/{activity.id}/progress")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4  # Progress for all vocabulary items
    # Verify mixed success rates
    success_rates = [item["success_rate"] for item in data]
    assert 1.0 in success_rates  # Some perfect scores
    assert 0.0 in success_rates  # Some failed attempts

def test_update_activity_groups(client: TestClient, db_session: Session, practice_setup):
    """Test updating activity's vocabulary groups."""
    # Create activity with first group
    activity = Activity(
        type="flashcard",
        name="Basic Practice",
        practice_direction="forward"
    )
    activity.vocabulary_groups.append(practice_setup["groups"][0])
    db_session.add(activity)
    db_session.commit()

    # Update to include both groups
    update_data = {
        "vocabulary_group_ids": [group.id for group in practice_setup["groups"]]
    }
    response = client.put(f"/api/v1/activities/{activity.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert len(data["vocabulary_groups"]) == 2

    # Verify practice items are updated
    practice_response = client.get(f"/api/v1/activities/{activity.id}/practice")
    assert len(practice_response.json()["items"]) == 4  # All vocabulary items 