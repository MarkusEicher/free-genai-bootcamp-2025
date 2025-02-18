import pytest
from app.models.vocabulary_group import VocabularyGroup

def test_create_vocabulary_group(db, sample_language_pair):
    group = VocabularyGroup(
        name="Travel",
        description="Travel-related vocabulary",
        language_pair_id=sample_language_pair.id
    )
    db.add(group)
    db.commit()
    
    assert group.id is not None
    assert group.name == "Travel"
    assert group.description == "Travel-related vocabulary"

def test_get_vocabulary_group(db, sample_vocabulary_group):
    group = db.query(VocabularyGroup).filter(VocabularyGroup.id == sample_vocabulary_group.id).first()
    assert group.name == "Test Group"
    assert group.description == "Test Description"

def test_update_vocabulary_group(db, sample_vocabulary_group):
    sample_vocabulary_group.name = "Advanced Basics"
    db.commit()
    
    updated_group = db.query(VocabularyGroup).first()
    assert updated_group.name == "Advanced Basics"

def test_delete_vocabulary_group(db, sample_vocabulary_group):
    db.delete(sample_vocabulary_group)
    db.commit()
    
    deleted_group = db.query(VocabularyGroup).first()
    assert deleted_group is None

def test_vocabulary_group_relationship(db, sample_vocabulary_group, sample_vocabulary):
    # Test adding vocabulary to group
    sample_vocabulary_group.vocabularies.append(sample_vocabulary)
    db.commit()
    
    # Test retrieving vocabulary from group
    group = db.query(VocabularyGroup).first()
    assert len(group.vocabularies) == 1
    assert group.vocabularies[0].word == "hello"