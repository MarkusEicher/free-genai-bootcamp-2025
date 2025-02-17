from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.associations import activity_vocabulary

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # e.g., "flashcard", "typing", "quiz"
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sessions = relationship("Session", back_populates="activity", cascade="all, delete-orphan")
    vocabularies = relationship("Vocabulary", secondary=activity_vocabulary, back_populates="activities")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    activity = relationship("Activity", back_populates="sessions")
    attempts = relationship("SessionAttempt", back_populates="session", cascade="all, delete-orphan")

    @property
    def correct_count(self) -> int:
        return sum(1 for attempt in self.attempts if attempt.is_correct)

    @property
    def incorrect_count(self) -> int:
        return sum(1 for attempt in self.attempts if not attempt.is_correct)

    @property
    def success_rate(self) -> float:
        total = len(self.attempts)
        if total == 0:
            return 0.0
        return self.correct_count / total

class SessionAttempt(Base):
    __tablename__ = "session_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"))
    vocabulary_id = Column(Integer, ForeignKey("vocabularies.id", ondelete="CASCADE"))
    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer)  # Response time in milliseconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    session = relationship("Session", back_populates="attempts")
    vocabulary = relationship("Vocabulary", back_populates="session_attempts")

# Import at bottom to avoid circular imports
from app.models.vocabulary import Vocabulary