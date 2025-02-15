from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class VocabularyProgress(Base):
    __tablename__ = "vocabulary_progress"

    id = Column(Integer, primary_key=True, index=True)
    vocabulary_id = Column(Integer, ForeignKey("vocabularies.id"))
    correct_attempts = Column(Integer, default=0, nullable=False)
    incorrect_attempts = Column(Integer, default=0, nullable=False)
    last_reviewed = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    mastered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vocabulary = relationship("Vocabulary", back_populates="progress")

    @property
    def success_rate(self):
        total = self.correct_attempts + self.incorrect_attempts
        if total == 0:
            return 0
        return (self.correct_attempts * 100.0) / total 