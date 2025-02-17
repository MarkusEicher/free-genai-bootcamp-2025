import pytest
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from sqlalchemy.exc import IntegrityError

def test_create_vocabulary(db, sample_language_pair):
    vocabulary = Vocabulary(
        word="goodbye",
        translation="auf wiedersehen",
        language_pair_id=sample_language_pair.id
    )
    db.add(vocabulary)
    db.commit()
    
    assert vocabulary.id is not None
    assert vocabulary.word == "goodbye"
    assert vocabulary.translation == "auf wiedersehen"
    assert vocabulary.language_pair_id == sample_language_pair.id

def test_get_vocabulary(db, sample_vocabulary):
    vocabulary = db.query(Vocabulary).filter(Vocabulary.id == sample_vocabulary.id).first()
    assert vocabulary.word == "hello"
    assert vocabulary.translation == "hola"

def test_update_vocabulary(db, sample_vocabulary):
    sample_vocabulary.translation = "guten tag"
    db.commit()
    db.refresh(sample_vocabulary)
    
    updated_vocab = db.query(Vocabulary).filter(Vocabulary.word == "hello").first()
    assert updated_vocab.translation == "guten tag"

def test_delete_vocabulary(db, sample_vocabulary):
    db.delete(sample_vocabulary)
    db.commit()
    
    deleted_vocab = db.query(Vocabulary).filter(Vocabulary.word == "hello").first()
    assert deleted_vocab is None

def test_add_vocabulary_to_group(db, sample_vocabulary, sample_vocabulary_group):
    # Test the many-to-many relationship
    sample_vocabulary_group.vocabularies.append(sample_vocabulary)
    db.commit()
    
    # Verify the vocabulary is in the group
    group = db.query(VocabularyGroup).first()
    assert len(group.vocabularies) == 1
    assert group.vocabularies[0].word == "hello"

def test_vocabulary_with_invalid_language_pair(db):
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=999  # Non-existent language pair
    )
    db.add(vocabulary)
    with pytest.raises(IntegrityError) as exc_info:
        db.flush()  # This will trigger the foreign key check
    db.rollback()
    assert "FOREIGN KEY constraint failed" in str(exc_info.value)

def test_vocabulary_unique_constraint(db, sample_language_pair):
    vocab1 = Vocabulary(
        word="test",
        translation="test1",
        language_pair_id=sample_language_pair.id
    )
    vocab2 = Vocabulary(
        word="test",  # Same word
        translation="test2",
        language_pair_id=sample_language_pair.id
    )
    db.add(vocab1)
    db.commit()
    
    db.add(vocab2)
    with pytest.raises(IntegrityError) as exc_info:
        db.commit()
    db.rollback()
    assert "UNIQUE constraint failed" in str(exc_info.value)