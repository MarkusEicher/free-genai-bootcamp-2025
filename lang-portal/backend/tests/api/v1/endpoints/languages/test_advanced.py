import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.language import Language
from app.models.language_pair import LanguagePair

def test_create_language(client: TestClient, db_session: Session):
    """Test language creation."""
    language_data = {
        "code": "fr",
        "name": "French"
    }
    response = client.post("/api/v1/languages", json=language_data)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == language_data["code"]
    assert data["name"] == language_data["name"]
    assert "id" in data

def test_create_duplicate_language(client: TestClient, db_session: Session):
    """Test creating duplicate language."""
    language_data = {
        "code": "es",
        "name": "Spanish"
    }
    # First creation should succeed
    response1 = client.post("/api/v1/languages", json=language_data)
    assert response1.status_code == 200

    # Second creation should fail
    response2 = client.post("/api/v1/languages", json=language_data)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"].lower()

def test_list_languages(client: TestClient, db_session: Session):
    """Test listing languages."""
    # Create test languages
    languages = [
        Language(code="de", name="German"),
        Language(code="it", name="Italian")
    ]
    for lang in languages:
        db_session.add(lang)
    db_session.commit()

    response = client.get("/api/v1/languages")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert all(isinstance(item["id"], int) for item in data)
    assert all(item["code"] in ["de", "it"] for item in data)

def test_get_language(client: TestClient, db_session: Session):
    """Test getting specific language."""
    language = Language(code="ru", name="Russian")
    db_session.add(language)
    db_session.commit()

    response = client.get(f"/api/v1/languages/{language.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == language.id
    assert data["code"] == language.code
    assert data["name"] == language.name

def test_update_language(client: TestClient, db_session: Session):
    """Test updating language."""
    language = Language(code="pl", name="Polish")
    db_session.add(language)
    db_session.commit()

    update_data = {
        "name": "Polski"  # Update name only
    }
    response = client.put(f"/api/v1/languages/{language.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == language.id
    assert data["code"] == "pl"  # Code shouldn't change
    assert data["name"] == "Polski"

def test_delete_language(client: TestClient, db_session: Session):
    """Test deleting language."""
    language = Language(code="nl", name="Dutch")
    db_session.add(language)
    db_session.commit()

    response = client.delete(f"/api/v1/languages/{language.id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Language deleted successfully"

    # Verify language is deleted
    assert db_session.query(Language).filter(Language.id == language.id).first() is None

def test_create_language_pair(client: TestClient, db_session: Session):
    """Test creating language pair."""
    # Create source and target languages
    source = Language(code="en", name="English")
    target = Language(code="ja", name="Japanese")
    db_session.add_all([source, target])
    db_session.commit()

    pair_data = {
        "source_language_id": source.id,
        "target_language_id": target.id
    }
    response = client.post("/api/v1/language-pairs", json=pair_data)
    assert response.status_code == 200
    data = response.json()
    assert data["source_language_id"] == source.id
    assert data["target_language_id"] == target.id

def test_get_language_pairs(client: TestClient, db_session: Session):
    """Test getting language pairs."""
    # Create languages
    lang1 = Language(code="sv", name="Swedish")
    lang2 = Language(code="no", name="Norwegian")
    db_session.add_all([lang1, lang2])
    db_session.commit()

    # Create language pair
    pair = LanguagePair(
        source_language_id=lang1.id,
        target_language_id=lang2.id
    )
    db_session.add(pair)
    db_session.commit()

    response = client.get("/api/v1/language-pairs")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(
        p["source_language_id"] == lang1.id and 
        p["target_language_id"] == lang2.id 
        for p in data
    )

def test_invalid_language_code(client: TestClient):
    """Test invalid language code handling."""
    language_data = {
        "code": "invalid",  # Should be 2 characters
        "name": "Invalid Language"
    }
    response = client.post("/api/v1/languages", json=language_data)
    assert response.status_code == 422
    assert "code" in str(response.json()["detail"]).lower()

def test_get_nonexistent_language(client: TestClient):
    """Test getting non-existent language."""
    response = client.get("/api/v1/languages/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_create_invalid_language_pair(client: TestClient, db_session: Session):
    """Test creating invalid language pair."""
    language = Language(code="fi", name="Finnish")
    db_session.add(language)
    db_session.commit()

    # Try to create pair with same source and target
    pair_data = {
        "source_language_id": language.id,
        "target_language_id": language.id
    }
    response = client.post("/api/v1/language-pairs", json=pair_data)
    assert response.status_code == 400
    assert "same language" in response.json()["detail"].lower()

def test_language_with_dependencies(client: TestClient, db_session: Session):
    """Test deleting language with dependencies."""
    # Create languages
    source = Language(code="ar", name="Arabic")
    target = Language(code="fa", name="Persian")
    db_session.add_all([source, target])
    db_session.commit()

    # Create language pair
    pair = LanguagePair(
        source_language_id=source.id,
        target_language_id=target.id
    )
    db_session.add(pair)
    db_session.commit()

    # Try to delete source language
    response = client.delete(f"/api/v1/languages/{source.id}")
    assert response.status_code == 400
    assert "dependencies" in response.json()["detail"].lower()

def test_language_search(client: TestClient, db_session: Session):
    """Test language search functionality."""
    # Create test languages
    languages = [
        Language(code="hi", name="Hindi"),
        Language(code="bn", name="Bengali"),
        Language(code="ta", name="Tamil")
    ]
    for lang in languages:
        db_session.add(lang)
    db_session.commit()

    # Search by partial name
    response = client.get("/api/v1/languages/search?q=hi")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(lang["code"] == "hi" for lang in data)

def test_language_statistics(client: TestClient, db_session: Session):
    """Test language statistics endpoint."""
    # Create language with some data
    language = Language(code="ko", name="Korean")
    db_session.add(language)
    db_session.commit()

    response = client.get(f"/api/v1/languages/{language.id}/statistics")
    assert response.status_code == 200
    data = response.json()
    assert "vocabulary_count" in data
    assert "learner_count" in data
    assert "average_success_rate" in data 