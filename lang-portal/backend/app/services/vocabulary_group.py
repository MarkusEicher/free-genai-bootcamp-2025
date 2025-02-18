from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.models.activity import Activity
from app.schemas.vocabulary_group import VocabularyGroupCreate, VocabularyGroupUpdate
from app.services.base import BaseService

class VocabularyGroupService(BaseService[VocabularyGroup, VocabularyGroupCreate, VocabularyGroupUpdate]):
    def __init__(self):
        super().__init__(VocabularyGroup)

    def create(self, db: Session, *, obj_in: VocabularyGroupCreate) -> VocabularyGroup:
        """Create a new vocabulary group with validation."""
        # Check if language pair exists
        if not db.query(func.count()).filter_by(id=obj_in.language_pair_id).scalar():
            raise HTTPException(status_code=404, detail="Language pair not found")

        # Create group
        db_obj = VocabularyGroup(
            name=obj_in.name,
            description=obj_in.description,
            language_pair_id=obj_in.language_pair_id
        )
        db.add(db_obj)
        try:
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="Group with this name already exists for this language pair"
            )

    def get_with_relationships(self, db: Session, *, id: int) -> Optional[VocabularyGroup]:
        """Get vocabulary group with its relationships."""
        return db.query(VocabularyGroup)\
            .filter(VocabularyGroup.id == id)\
            .first()

    def get_practice_items(
        self, db: Session, *, group_id: int, reverse: bool = False
    ) -> List[Dict[str, Any]]:
        """Get practice items for a group."""
        group = self.get(db, id=group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Vocabulary group not found")

        return [
            {
                "word": vocab.translation if reverse else vocab.word,
                "translation": vocab.word if reverse else vocab.translation,
                "vocabulary_id": vocab.id
            }
            for vocab in group.vocabularies
        ]

    def add_vocabularies(
        self, db: Session, *, group_id: int, vocabulary_ids: List[int]
    ) -> VocabularyGroup:
        """Add multiple vocabularies to a group."""
        group = self.get(db, id=group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Vocabulary group not found")

        # Get vocabularies
        vocabularies = db.query(Vocabulary)\
            .filter(Vocabulary.id.in_(vocabulary_ids))\
            .all()

        if len(vocabularies) != len(vocabulary_ids):
            raise HTTPException(status_code=400, detail="Some vocabulary IDs not found")

        # Verify language pair matches
        if any(v.language_pair_id != group.language_pair_id for v in vocabularies):
            raise HTTPException(
                status_code=400,
                detail="All vocabularies must be from the same language pair as the group"
            )

        # Add vocabularies
        for vocab in vocabularies:
            if vocab not in group.vocabularies:
                group.vocabularies.append(vocab)

        db.commit()
        db.refresh(group)
        return group

    def remove_vocabulary(
        self, db: Session, *, group_id: int, vocabulary_id: int
    ) -> VocabularyGroup:
        """Remove a vocabulary from a group with activity usage check."""
        group = self.get(db, id=group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Vocabulary group not found")

        vocabulary = db.query(Vocabulary).filter(Vocabulary.id == vocabulary_id).first()
        if not vocabulary:
            raise HTTPException(status_code=404, detail="Vocabulary not found")

        if vocabulary not in group.vocabularies:
            raise HTTPException(status_code=400, detail="Vocabulary not in group")

        # Check if vocabulary is used in any activities through this group
        activities_using_group = db.query(Activity)\
            .filter(Activity.vocabulary_groups.contains(group))\
            .all()

        if activities_using_group:
            raise ValueError(
                "Cannot remove vocabulary as it is used in active activities"
            )

        group.vocabularies.remove(vocabulary)
        db.commit()
        db.refresh(group)
        return group

    def delete(self, db: Session, *, id: int) -> VocabularyGroup:
        """Delete a group with activity usage check."""
        group = self.get(db, id=id)
        if not group:
            raise HTTPException(status_code=404, detail="Vocabulary group not found")

        # Check if group is used in any activities
        activities_using_group = db.query(Activity)\
            .filter(Activity.vocabulary_groups.contains(group))\
            .all()

        if activities_using_group:
            raise ValueError(
                "Cannot delete group as it is used in active activities"
            )

        db.delete(group)
        db.commit()
        return group

# Create service instance
vocabulary_group_service = VocabularyGroupService() 