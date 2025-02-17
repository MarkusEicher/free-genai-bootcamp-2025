from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.db.base_class import Base

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # e.g., "flashcard", "typing", "quiz"
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    success_rate = Column(Float, default=0.0)

class ActivityProgress(Base):
    __tablename__ = "activity_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    vocabulary_id = Column(Integer, ForeignKey("vocabularies.id"))
    correct_count = Column(Integer, default=0)
    attempt_count = Column(Integer, default=0)
    last_attempt = Column(DateTime(timezone=True))
    success_rate = Column(Float, default=0.0)