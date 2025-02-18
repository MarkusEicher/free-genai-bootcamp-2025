from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base
from app.models.associations import activity_vocabulary

# Add indexes to the existing activity_vocabulary table
Index('ix_activity_vocabulary_activity_id', activity_vocabulary.c.activity_id)
Index('ix_activity_vocabulary_vocabulary_id', activity_vocabulary.c.vocabulary_id)

class Activity(Base):
    __tablename__ = 'activities'
    __table_args__ = (
        Index('ix_activities_type', 'type'),
        Index('ix_activities_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sessions = relationship("Session", back_populates="activity")
    vocabularies = relationship("Vocabulary", secondary=activity_vocabulary)

class Session(Base):
    __tablename__ = 'sessions'
    __table_args__ = (
        Index('ix_sessions_activity_id', 'activity_id'),
        Index('ix_sessions_start_time', 'start_time'),
        Index('ix_sessions_end_time', 'end_time'),
    )

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey('activities.id'), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    activity = relationship("Activity", back_populates="sessions")
    attempts = relationship("SessionAttempt", back_populates="session")

    @property
    def success_rate(self) -> float:
        """Calculate success rate for this session."""
        if not self.attempts:
            return 0.0
        correct_count = sum(1 for a in self.attempts if a.is_correct)
        return round(correct_count / len(self.attempts), 3)

    @property
    def correct_count(self) -> int:
        """Get number of correct attempts."""
        return sum(1 for a in self.attempts if a.is_correct)

    @property
    def incorrect_count(self) -> int:
        """Get number of incorrect attempts."""
        return sum(1 for a in self.attempts if not a.is_correct)

class SessionAttempt(Base):
    __tablename__ = 'session_attempts'
    __table_args__ = (
        Index('ix_session_attempts_session_id', 'session_id'),
        Index('ix_session_attempts_vocabulary_id', 'vocabulary_id'),
        Index('ix_session_attempts_is_correct', 'is_correct'),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False)
    vocabulary_id = Column(Integer, ForeignKey('vocabularies.id'), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="attempts")
    vocabulary = relationship("Vocabulary")

# Import at bottom to avoid circular imports
from app.models.vocabulary import Vocabulary