import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.vocabulary import Vocabulary
from app.models.language_pair import LanguagePair
from datetime import datetime, UTC
import random

# client will be injected by pytest from root conftest.py

def test_create_vocabulary(client, test_language_pair):
    # Add random suffix to make word unique
    suffix = random.randint(1000, 9999)
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": f"hello_{suffix}",  # Make unique
            "translation": "hallo",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 200
    return response.json()

def test_get_vocabulary(client, test_vocabulary):
    response = client.get(f"/api/v1/vocabularies/{test_vocabulary.id}")
    assert response.status_code == 200
    assert response.json()["word"] == "test"

def test_update_vocabulary(client, test_language_pair):
    created = test_create_vocabulary(client, test_language_pair)
    
    response = client.put(
        f"/api/v1/vocabularies/{created['id']}",
        json={"translation": "guten tag"}
    )
    assert response.status_code == 200
    assert response.json()["translation"] == "guten tag"

def test_delete_vocabulary(client, test_language_pair):
    created = test_create_vocabulary(client, test_language_pair)
    
    response = client.delete(f"/api/v1/vocabularies/{created['id']}")
    assert response.status_code == 204
    
    response = client.get(f"/api/v1/vocabularies/{created['id']}")
    assert response.status_code == 404

def test_search_vocabularies(client, test_language_pair):
    # Create a vocabulary first
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": "hello",
            "translation": "hallo",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 200
    
    # Search for it
    response = client.get("/api/v1/vocabularies/?search=hello")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
    assert data["items"][0]["word"] == "hello"

def test_list_vocabularies(client, test_language_pair):
    test_create_vocabulary(client, test_language_pair)
    
    response = client.get("/api/v1/vocabularies/?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "items" in data
    assert "total" in data

def test_get_vocabulary_not_found(client):
    response = client.get("/api/v1/vocabularies/999")
    assert response.status_code == 404

def test_create_vocabulary_invalid_data(client, test_language_pair):
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": "",  # Empty word
            "translation": "test",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 422  # Validation error

def test_update_vocabulary_not_found(client):
    response = client.put(
        "/api/v1/vocabularies/999",
        json={"translation": "test"}
    )
    assert response.status_code == 404

def test_search_vocabularies_validation(client):
    response = client.get("/api/v1/vocabularies/search/?limit=1000")
    assert response.status_code == 422

def test_create_vocabulary_duplicate(client, test_language_pair):
    # First creation
    suffix = random.randint(1000, 9999)
    word = f"hello_{suffix}"
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": word,
            "translation": "hallo",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 200

    # Try to create duplicate
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": word,  # Same word
            "translation": "different",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_create_vocabulary_invalid_language_pair(client):
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": "test",
            "translation": "test",
            "language_pair_id": 999  # Non-existent language pair
        }
    )
    assert response.status_code == 404
    assert "Language pair not found" in response.json()["detail"]

def test_list_vocabularies_empty(client, db_session):
    response = client.get("/api/v1/vocabularies/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["page"] == 1
    assert data["size"] == 20
    assert data["pages"] == 0

def test_list_vocabularies_pagination(client, db_session, test_language_pair):
    # Create 25 vocabularies
    for i in range(25):
        vocab = Vocabulary(
            word=f"word_{i}",
            translation=f"translation_{i}",
            language_pair_id=test_language_pair.id
        )
        db_session.add(vocab)
    db_session.commit()

    # Test first page
    response = client.get("/api/v1/vocabularies/?page=1&size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25
    assert len(data["items"]) == 10
    assert data["page"] == 1
    assert data["size"] == 10
    assert data["pages"] == 3

    # Test last page
    response = client.get("/api/v1/vocabularies/?page=3&size=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 5  # Last page has remaining items

def test_list_vocabularies_search(client, db_session, test_language_pair):
    # Create test vocabularies
    vocab1 = Vocabulary(
        word="apple",
        translation="apfel",
        language_pair_id=test_language_pair.id
    )
    vocab2 = Vocabulary(
        word="banana",
        translation="banane",
        language_pair_id=test_language_pair.id
    )
    db_session.add_all([vocab1, vocab2])
    db_session.commit()

    # Test word search
    response = client.get("/api/v1/vocabularies/?search=apple")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["word"] == "apple"

    # Test translation search
    response = client.get("/api/v1/vocabularies/?search=banane")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["translation"] == "banane"

    # Test case insensitive search
    response = client.get("/api/v1/vocabularies/?search=APPLE")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["word"] == "apple"

def test_list_vocabularies_by_language_pair(client, db_session, test_language_pair):
    # Create another language pair
    other_pair = LanguagePair(
        source_language_id=test_language_pair.source_language_id,
        target_language_id=test_language_pair.target_language_id
    )
    db_session.add(other_pair)
    db_session.commit()

    # Create vocabularies for both pairs
    vocab1 = Vocabulary(
        word="test1",
        translation="test1",
        language_pair_id=test_language_pair.id
    )
    vocab2 = Vocabulary(
        word="test2",
        translation="test2",
        language_pair_id=other_pair.id
    )
    db_session.add_all([vocab1, vocab2])
    db_session.commit()

    # Test filtering
    response = client.get(f"/api/v1/vocabularies/?language_pair_id={test_language_pair.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["word"] == "test1"

def test_create_vocabulary(client, test_language_pair):
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": "test",
            "translation": "test",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["word"] == "test"
    assert data["translation"] == "test"
    assert data["language_pair_id"] == test_language_pair.id
    assert "id" in data
    assert "created_at" in data
    assert data["success_rate"] == 0.0

def test_create_vocabulary_duplicate(client, test_language_pair, db_session):
    # Create first vocabulary
    vocab = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab)
    db_session.commit()

    # Try to create duplicate
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": "test",
            "translation": "different",
            "language_pair_id": test_language_pair.id
        }
    )
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "duplicate_vocabulary"
    assert data["word"] == "test"
    assert data["language_pair_id"] == test_language_pair.id

def test_create_vocabulary_invalid_language_pair(client):
    response = client.post(
        "/api/v1/vocabularies/",
        json={
            "word": "test",
            "translation": "test",
            "language_pair_id": 999
        }
    )
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "language_pair_not_found"

def test_create_vocabularies_bulk(client, test_language_pair):
    vocabularies = [
        {
            "word": f"bulk_test_{i}",
            "translation": f"bulk_translation_{i}",
            "language_pair_id": test_language_pair.id
        }
        for i in range(3)
    ]

    response = client.post("/api/v1/vocabularies/bulk", json=vocabularies)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert all(v["language_pair_id"] == test_language_pair.id for v in data)

def test_create_vocabularies_bulk_empty(client):
    response = client.post("/api/v1/vocabularies/bulk", json=[])
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "empty_vocabulary_list"

def test_create_vocabularies_bulk_duplicates(client, test_language_pair):
    vocabularies = [
        {
            "word": "same_word",
            "translation": "translation1",
            "language_pair_id": test_language_pair.id
        },
        {
            "word": "same_word",  # Duplicate word
            "translation": "translation2",
            "language_pair_id": test_language_pair.id
        }
    ]

    response = client.post("/api/v1/vocabularies/bulk", json=vocabularies)
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "duplicate_vocabularies"

def test_get_vocabulary(client, db_session, test_language_pair):
    vocab = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab)
    db_session.commit()

    response = client.get(f"/api/v1/vocabularies/{vocab.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["word"] == "test"
    assert data["translation"] == "test"
    assert data["language_pair_id"] == test_language_pair.id
    assert "language_pair" in data

def test_get_vocabulary_not_found(client):
    response = client.get("/api/v1/vocabularies/999")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "vocabulary_not_found"

def test_update_vocabulary(client, db_session, test_language_pair):
    vocab = Vocabulary(
        word="old_word",
        translation="old_translation",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab)
    db_session.commit()

    response = client.put(
        f"/api/v1/vocabularies/{vocab.id}",
        json={
            "word": "new_word",
            "translation": "new_translation"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["word"] == "new_word"
    assert data["translation"] == "new_translation"
    assert "updated_at" in data

def test_update_vocabulary_not_found(client):
    response = client.put(
        "/api/v1/vocabularies/999",
        json={"word": "test"}
    )
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "vocabulary_not_found"

def test_update_vocabulary_invalid_language_pair(client, db_session, test_language_pair):
    vocab = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab)
    db_session.commit()

    response = client.put(
        f"/api/v1/vocabularies/{vocab.id}",
        json={"language_pair_id": 999}
    )
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "language_pair_not_found"

def test_delete_vocabulary(client, db_session, test_language_pair):
    vocab = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocab)
    db_session.commit()

    response = client.delete(f"/api/v1/vocabularies/{vocab.id}")
    assert response.status_code == 204

    # Verify deletion
    assert db_session.query(Vocabulary).filter_by(id=vocab.id).first() is None

def test_delete_vocabulary_not_found(client):
    response = client.delete("/api/v1/vocabularies/999")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "vocabulary_not_found"

def test_delete_vocabularies_bulk(client, db_session, test_language_pair):
    # Create test vocabularies
    vocabs = [
        Vocabulary(
            word=f"test_{i}",
            translation=f"test_{i}",
            language_pair_id=test_language_pair.id
        )
        for i in range(3)
    ]
    db_session.add_all(vocabs)
    db_session.commit()

    vocab_ids = [v.id for v in vocabs]
    response = client.request(
        "DELETE",
        "/api/v1/vocabularies/bulk",
        json=vocab_ids
    )
    assert response.status_code == 204

    # Verify deletion
    remaining = db_session.query(Vocabulary).filter(Vocabulary.id.in_(vocab_ids)).count()
    assert remaining == 0

def test_delete_vocabularies_bulk_empty(client):
    response = client.request(
        "DELETE",
        "/api/v1/vocabularies/bulk",
        json=[]
    )
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "empty_id_list"

def test_delete_vocabularies_bulk_not_found(client):
    response = client.request(
        "DELETE",
        "/api/v1/vocabularies/bulk",
        json=[999, 1000]
    )
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "vocabularies_not_found"