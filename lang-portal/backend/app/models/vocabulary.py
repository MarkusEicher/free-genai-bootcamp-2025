from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, index=True)
    translation = Column(String)
    language_pair_id = Column(Integer, ForeignKey("language_pairs.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    language_pair = relationship("LanguagePair")
    groups = relationship(
        "VocabularyGroup",
        secondary="vocabulary_group_association",
        back_populates="vocabularies"
    )

    __table_args__ = (
        UniqueConstraint('word', 'language_pair_id', name='unique_word_per_language_pair'),
    ) 