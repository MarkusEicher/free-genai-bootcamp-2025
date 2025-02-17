from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
from app.models.associations import vocabulary_group_association

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