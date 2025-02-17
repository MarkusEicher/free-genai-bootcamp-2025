from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.models.vocabulary_group import vocabulary_group_association

class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, nullable=False)
    translation = Column(String, nullable=False)
    language_pair_id = Column(
        Integer,
        ForeignKey("language_pairs.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    language_pair = relationship("LanguagePair", back_populates="vocabularies")
    progress = relationship(
        "VocabularyProgress",
        back_populates="vocabulary",
        uselist=False,
        cascade="all, delete-orphan"
    )
    groups = relationship(
        "VocabularyGroup",
        secondary=vocabulary_group_association,
        back_populates="vocabularies"
    )

    __table_args__ = (
        UniqueConstraint('word', 'language_pair_id', name='uix_word_language_pair'),
    )

    @property
    def success_rate(self) -> float:
        if not self.progress:
            return 0.0
        return self.progress.success_rate