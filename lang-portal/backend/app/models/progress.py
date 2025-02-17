from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.db.base_class import Base
from datetime import datetime, UTC

class VocabularyProgress(Base):
    __tablename__ = "vocabulary_progress"

    id = Column(Integer, primary_key=True, index=True)
    vocabulary_id = Column(Integer, ForeignKey("vocabularies.id", ondelete="CASCADE"))
    correct_attempts = Column(Integer, default=0, nullable=False)
    incorrect_attempts = Column(Integer, default=0, nullable=False)
    last_reviewed = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    mastered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def success_rate(self) -> float:
        total = self.correct_attempts + self.incorrect_attempts
        if total == 0:
            return 0.0
        return (self.correct_attempts / total) * 100 