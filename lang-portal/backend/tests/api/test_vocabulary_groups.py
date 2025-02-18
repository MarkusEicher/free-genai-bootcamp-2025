import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.vocabulary_group import VocabularyGroup
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary

@pytest.fixture
def language_pair(db_session: Session):
    """Create a test language pair."""
    source = Language(code="en", name="English")
    target = Language(code="es", name="Spanish")
    db_session.add_all([source, target])
    db_session.commit()
    
    pair = LanguagePair(
        source_language_id=source.id,
        target_language_id=target.id
    )
    db_session.add(pair)
    db_session.commit()
    return pair

def test_create_vocabulary_group(client: TestClient, db_session: Session, language_pair):
    """Test vocabulary group creation."""
    group_data = {
        "name": "Basic Vocabulary",
        "description": "Essential words for beginners",
        "language_pair_id": language_pair.id
    }
    response = client.post("/api/v1/vocabulary-groups", json=group_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == group_data["name"]
    assert data["description"] == group_data["description"]
    assert data["language_pair_id"] == language_pair.id
    assert "id" in data

def test_create_duplicate_group(client: TestClient, db_session: Session, language_pair):
    """Test creating duplicate group names within same language pair."""
    group_data = {
        "name": "Common Phrases",
        "language_pair_id": language_pair.id
    }
    # First creation should succeed
    response1 = client.post("/api/v1/vocabulary-groups", json=group_data)
    assert response1.status_code == 200

    # Second creation should fail
    response2 = client.post("/api/v1/vocabulary-groups", json=group_data)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"].lower()

def test_list_vocabulary_groups(client: TestClient, db_session: Session, language_pair):
    """Test listing vocabulary groups."""
    # Create test groups
    groups = [
        VocabularyGroup(
            name="Food",
            description="Food-related vocabulary",
            language_pair_id=language_pair.id
        ),
        VocabularyGroup(
            name="Travel",
            description="Travel-related vocabulary",
            language_pair_id=language_pair.id
        )
    ]
    for group in groups:
        db_session.add(group)
    db_session.commit()

    response = client.get("/api/v1/vocabulary-groups")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all(isinstance(item["id"], int) for item in data)
    assert all(item["language_pair_id"] == language_pair.id for item in data)

def test_get_vocabulary_group(client: TestClient, db_session: Session, language_pair):
    """Test getting specific vocabulary group."""
    group = VocabularyGroup(
        name="Numbers",
        description="Number vocabulary",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    response = client.get(f"/api/v1/vocabulary-groups/{group.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == group.id
    assert data["name"] == group.name
    assert data["description"] == group.description

def test_update_vocabulary_group(client: TestClient, db_session: Session, language_pair):
    """Test updating vocabulary group."""
    group = VocabularyGroup(
        name="Colors",
        description="Color vocabulary",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    update_data = {
        "description": "Updated color vocabulary description"
    }
    response = client.put(f"/api/v1/vocabulary-groups/{group.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == group.id
    assert data["name"] == "Colors"  # Name shouldn't change
    assert data["description"] == update_data["description"]

def test_delete_vocabulary_group(client: TestClient, db_session: Session, language_pair):
    """Test deleting vocabulary group."""
    group = VocabularyGroup(
        name="Animals",
        description="Animal vocabulary",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    response = client.delete(f"/api/v1/vocabulary-groups/{group.id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Vocabulary group deleted successfully"

    # Verify group is deleted
    assert db_session.query(VocabularyGroup).filter(
        VocabularyGroup.id == group.id
    ).first() is None

def test_add_vocabulary_to_group(client: TestClient, db_session: Session, language_pair):
    """Test adding vocabulary to group."""
    # Create group
    group = VocabularyGroup(
        name="Verbs",
        description="Verb vocabulary",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    # Create vocabulary
    vocab = Vocabulary(
        word="run",
        translation="correr",
        language_pair_id=language_pair.id
    )
    db_session.add(vocab)
    db_session.commit()

    # Add vocabulary to group
    response = client.post(
        f"/api/v1/vocabulary-groups/{group.id}/vocabularies/{vocab.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert vocab.id in [v["id"] for v in data["vocabularies"]]

def test_remove_vocabulary_from_group(
    client: TestClient, db_session: Session, language_pair
):
    """Test removing vocabulary from group."""
    # Create group and vocabulary
    group = VocabularyGroup(
        name="Adjectives",
        description="Adjective vocabulary",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    vocab = Vocabulary(
        word="happy",
        translation="feliz",
        language_pair_id=language_pair.id
    )
    db_session.add(vocab)
    db_session.commit()

    # Add and then remove vocabulary
    group.vocabularies.append(vocab)
    db_session.commit()

    response = client.delete(
        f"/api/v1/vocabulary-groups/{group.id}/vocabularies/{vocab.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert vocab.id not in [v["id"] for v in data["vocabularies"]]

def test_list_group_vocabularies(client: TestClient, db_session: Session, language_pair):
    """Test listing vocabularies in a group."""
    # Create group
    group = VocabularyGroup(
        name="Family",
        description="Family vocabulary",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    # Create and add vocabularies
    vocabs = [
        Vocabulary(word="mother", translation="madre", language_pair_id=language_pair.id),
        Vocabulary(word="father", translation="padre", language_pair_id=language_pair.id)
    ]
    for vocab in vocabs:
        db_session.add(vocab)
        group.vocabularies.append(vocab)
    db_session.commit()

    response = client.get(f"/api/v1/vocabulary-groups/{group.id}/vocabularies")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(v["word"] in ["mother", "father"] for v in data)

def test_group_statistics(client: TestClient, db_session: Session, language_pair):
    """Test vocabulary group statistics."""
    group = VocabularyGroup(
        name="Test Group",
        description="Test description",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    response = client.get(f"/api/v1/vocabulary-groups/{group.id}/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "vocabulary_count" in data
    assert "mastered_count" in data
    assert "average_success_rate" in data

def test_filter_groups_by_language_pair(
    client: TestClient, db_session: Session, language_pair
):
    """Test filtering vocabulary groups by language pair."""
    # Create another language pair
    other_target = Language(code="fr", name="French")
    db_session.add(other_target)
    db_session.commit()
    
    other_pair = LanguagePair(
        source_language_id=language_pair.source_language_id,
        target_language_id=other_target.id
    )
    db_session.add(other_pair)
    db_session.commit()

    # Create groups in different language pairs
    groups = [
        VocabularyGroup(
            name="Spanish Group",
            language_pair_id=language_pair.id
        ),
        VocabularyGroup(
            name="French Group",
            language_pair_id=other_pair.id
        )
    ]
    for group in groups:
        db_session.add(group)
    db_session.commit()

    # Filter by Spanish language pair
    response = client.get(
        f"/api/v1/vocabulary-groups?language_pair_id={language_pair.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Spanish Group"

def test_group_with_dependencies(client: TestClient, db_session: Session, language_pair):
    """Test deleting group with vocabularies."""
    # Create group
    group = VocabularyGroup(
        name="Test Group",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    # Add vocabulary
    vocab = Vocabulary(
        word="test",
        translation="prueba",
        language_pair_id=language_pair.id
    )
    db_session.add(vocab)
    group.vocabularies.append(vocab)
    db_session.commit()

    # Try to delete group
    response = client.delete(f"/api/v1/vocabulary-groups/{group.id}")
    assert response.status_code == 400
    assert "dependencies" in response.json()["detail"].lower()

def test_bulk_add_vocabularies(client: TestClient, db_session: Session, language_pair):
    """Test bulk adding vocabularies to group."""
    # Create group
    group = VocabularyGroup(
        name="Bulk Test",
        language_pair_id=language_pair.id
    )
    db_session.add(group)
    db_session.commit()

    # Create vocabularies
    vocabs = [
        Vocabulary(word=f"word{i}", translation=f"trans{i}", 
                  language_pair_id=language_pair.id)
        for i in range(3)
    ]
    for vocab in vocabs:
        db_session.add(vocab)
    db_session.commit()

    vocab_ids = [v.id for v in vocabs]
    response = client.post(
        f"/api/v1/vocabulary-groups/{group.id}/vocabularies/bulk",
        json={"vocabulary_ids": vocab_ids}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["vocabularies"]) == 3
    assert all(v["id"] in vocab_ids for v in data["vocabularies"]) 