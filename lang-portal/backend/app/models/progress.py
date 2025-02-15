from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class VocabularyProgress(Base):
    __tablename__ = "vocabulary_progress"

    id = Column(Integer, primary_key=True, index=True)
    vocabulary_id = Column(Integer, ForeignKey("vocabularies.id", ondelete="CASCADE"))
    correct_attempts = Column(Integer, default=0)
    incorrect_attempts = Column(Integer, default=0)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
    mastered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vocabulary = relationship("Vocabulary", back_populates="progress")

    @property
    def success_rate(self):
        total = self.correct_attempts + self.incorrect_attempts
        return (self.correct_attempts / total * 100) if total > 0 else 0 