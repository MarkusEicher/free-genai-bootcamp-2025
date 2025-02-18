from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
from app.models.associations import vocabulary_group_association, activity_vocabulary_group
from typing import List, Dict

class VocabularyGroup(Base):
    __tablename__ = "vocabulary_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    language_pair_id = Column(Integer, ForeignKey("language_pairs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    language_pair = relationship("LanguagePair", back_populates="vocabulary_groups")
    vocabularies = relationship(
        "Vocabulary",
        secondary=vocabulary_group_association,
        back_populates="groups"
    )
    activities = relationship(
        "Activity",
        secondary=activity_vocabulary_group,
        back_populates="vocabulary_groups"
    )

    def get_practice_items(self, reverse: bool = False) -> List[Dict]:
        """
        Get vocabulary items for practice, optionally in reverse direction.
        
        Args:
            reverse (bool): If True, swap word and translation
        
        Returns:
            List of dictionaries containing practice items
        """
        items = []
        for vocab in self.vocabularies:
            items.append({
                "word": vocab.translation if reverse else vocab.word,
                "translation": vocab.word if reverse else vocab.translation,
                "vocabulary_id": vocab.id,
                "language_pair_id": vocab.language_pair_id
            })
        return items