from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Index, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base_class import Base
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import os

from app.models.associations import activity_vocabulary_group

# Add indexes to the activity_vocabulary_group table
Index('ix_activity_vocabulary_group_activity_id', activity_vocabulary_group.c.activity_id)
Index('ix_activity_vocabulary_group_group_id', activity_vocabulary_group.c.group_id)
Index('ix_activity_vocabulary_group_created_at', activity_vocabulary_group.c.created_at)

class Activity(Base):
    __tablename__ = 'activities'
    __table_args__ = (
        Index('ix_activities_type', 'type'),
        Index('ix_activities_created_at', 'created_at'),
        Index('ix_activities_name', 'name'),
        Index('ix_activities_practice_direction', 'practice_direction'),
        Index('ix_activities_privacy_level', 'privacy_level'),
    )

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    practice_direction = Column(String, nullable=False, server_default='forward')
    
    # Privacy-focused fields
    privacy_level = Column(String, nullable=False, server_default='private',
                          comment='private, shared, or public')
    retention_days = Column(Integer, nullable=False, server_default='30',
                          comment='Number of days to retain activity data')
    local_storage_path = Column(String, nullable=True,
                              comment='Path to local storage for offline data')
    requires_sync = Column(Boolean, nullable=False, server_default='false',
                          comment='Whether this activity needs sync with server')
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_deletion_at = Column(DateTime(timezone=True), nullable=True)

    sessions = relationship(
        "Session",
        back_populates="activity",
        cascade="all, delete-orphan",
        lazy="selectin",  # Optimize loading of sessions
        order_by="desc(Session.start_time)"  # Order by most recent first
    )
    vocabulary_groups = relationship(
        "VocabularyGroup",
        secondary=activity_vocabulary_group,
        back_populates="activities",
        lazy="selectin",  # Eager load groups for better performance
        order_by="VocabularyGroup.name"  # Order groups by name
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.update_deletion_schedule()

    def update_deletion_schedule(self) -> None:
        """Update the scheduled deletion date based on retention period."""
        if self.retention_days:
            self.scheduled_deletion_at = datetime.utcnow() + timedelta(days=self.retention_days)

    def update_last_accessed(self) -> None:
        """Update the last accessed timestamp."""
        self.last_accessed_at = datetime.utcnow()

    def get_local_storage_path(self) -> Optional[str]:
        """Get the path for local storage, creating if necessary."""
        if not self.local_storage_path and self.id:
            base_path = os.path.join('data', 'activities', str(self.id))
            os.makedirs(base_path, exist_ok=True)
            self.local_storage_path = base_path
        return self.local_storage_path

    def sanitize_data(self, data: Dict) -> Dict:
        """Sanitize activity data for privacy."""
        sensitive_fields = {'user_id', 'ip_address', 'session_id', 'device_info'}
        return {k: v for k, v in data.items() if k not in sensitive_fields}

    def to_dict(self, include_private: bool = False) -> Dict:
        """Convert activity to dictionary with privacy controls."""
        data = {
            'id': self.id,
            'type': self.type,
            'name': self.name,
            'description': self.description,
            'practice_direction': self.practice_direction,
            'privacy_level': self.privacy_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_private:
            data.update({
                'retention_days': self.retention_days,
                'local_storage_path': self.local_storage_path,
                'requires_sync': self.requires_sync,
                'last_accessed_at': self.last_accessed_at.isoformat() if self.last_accessed_at else None,
                'scheduled_deletion_at': self.scheduled_deletion_at.isoformat() if self.scheduled_deletion_at else None,
            })
        
        return data

    def save_local_data(self, data: Dict) -> None:
        """Save activity data to local storage."""
        if not self.local_storage_path:
            self.get_local_storage_path()
        
        sanitized_data = self.sanitize_data(data)
        file_path = os.path.join(self.local_storage_path, 'activity_data.json')
        
        with open(file_path, 'w') as f:
            json.dump(sanitized_data, f)

    def load_local_data(self) -> Optional[Dict]:
        """Load activity data from local storage."""
        if not self.local_storage_path:
            return None
            
        file_path = os.path.join(self.local_storage_path, 'activity_data.json')
        if not os.path.exists(file_path):
            return None
            
        with open(file_path, 'r') as f:
            return json.load(f)

    def cleanup_local_data(self) -> None:
        """Clean up local data if retention period has expired."""
        if not self.local_storage_path:
            return
            
        if self.scheduled_deletion_at and datetime.utcnow() >= self.scheduled_deletion_at:
            import shutil
            shutil.rmtree(self.local_storage_path, ignore_errors=True)
            self.local_storage_path = None

    def get_practice_vocabulary(self) -> list:
        """Get vocabulary items in correct practice direction."""
        items = []
        reverse = self.practice_direction == "reverse"
        for group in self.vocabulary_groups:
            items.extend(group.get_practice_items(reverse=reverse))
        return items

    @property
    def vocabulary_count(self) -> int:
        """Get total number of vocabulary items across all groups."""
        return sum(len(group.vocabularies) for group in self.vocabulary_groups)

    @property
    def unique_vocabulary_count(self) -> int:
        """Get number of unique vocabulary items across all groups."""
        unique_ids = set()
        for group in self.vocabulary_groups:
            unique_ids.update(v.id for v in group.vocabularies)
        return len(unique_ids)

    @property
    def language_pairs(self) -> set:
        """Get unique language pairs used in this activity's groups."""
        return {group.language_pair_id for group in self.vocabulary_groups}

class Session(Base):
    __tablename__ = 'sessions'
    __table_args__ = (
        Index('ix_sessions_activity_id', 'activity_id'),
        Index('ix_sessions_start_time', 'start_time'),
        Index('ix_sessions_end_time', 'end_time'),
        Index('ix_sessions_created_at', 'created_at'),
    )

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey('activities.id', ondelete='CASCADE'), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Cache success metrics
    _correct_count = Column('correct_count', Integer, server_default='0')
    _incorrect_count = Column('incorrect_count', Integer, server_default='0')
    _success_rate = Column('success_rate', Float, server_default='0.0')

    activity = relationship(
        "Activity",
        back_populates="sessions",
        lazy="joined"  # Always load activity with session
    )
    attempts = relationship(
        "SessionAttempt",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",  # Optimize loading of attempts
        order_by="SessionAttempt.created_at"  # Order by creation time
    )

    @property
    def success_rate(self) -> float:
        """Calculate success rate for this session."""
        if not self.attempts:
            return 0.0
        correct_count = sum(1 for a in self.attempts if a.is_correct)
        rate = round(correct_count / len(self.attempts), 3)
        if rate != self._success_rate:
            self._success_rate = rate
        return rate

    @property
    def correct_count(self) -> int:
        """Get number of correct attempts."""
        count = sum(1 for a in self.attempts if a.is_correct)
        if count != self._correct_count:
            self._correct_count = count
        return count

    @property
    def incorrect_count(self) -> int:
        """Get number of incorrect attempts."""
        count = sum(1 for a in self.attempts if not a.is_correct)
        if count != self._incorrect_count:
            self._incorrect_count = count
        return count

class SessionAttempt(Base):
    __tablename__ = 'session_attempts'
    __table_args__ = (
        Index('ix_session_attempts_session_id', 'session_id'),
        Index('ix_session_attempts_vocabulary_id', 'vocabulary_id'),
        Index('ix_session_attempts_is_correct', 'is_correct'),
        Index('ix_session_attempts_created_at', 'created_at'),
        Index('ix_session_attempts_response_time', 'response_time_ms'),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('sessions.id', ondelete='CASCADE'), nullable=False)
    vocabulary_id = Column(Integer, ForeignKey('vocabularies.id', ondelete='CASCADE'), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship(
        "Session",
        back_populates="attempts",
        lazy="joined"  # Always load session with attempt
    )
    vocabulary = relationship(
        "Vocabulary",
        lazy="joined",  # Always load vocabulary with attempt
        innerjoin=True  # Use INNER JOIN for better performance
    )

    def __init__(self, **kwargs):
        """Initialize with validation."""
        super().__init__(**kwargs)
        if self.response_time_ms <= 0:
            raise ValueError("Response time must be positive")

# Import at bottom to avoid circular imports
from app.models.vocabulary import Vocabulary