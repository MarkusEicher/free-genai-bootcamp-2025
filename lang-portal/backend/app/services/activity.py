from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.vocabulary import Vocabulary
from app.models.progress import VocabularyProgress
from app.schemas.activity import (
    ActivityCreate,
    ActivityUpdate,
    SessionCreate,
    SessionResponse,
    ActivityProgressResponse
)
from app.services.base import BaseService

class ActivityService(BaseService[Activity, ActivityCreate, ActivityUpdate]):
    def __init__(self):
        super().__init__(Activity)

    def create_with_validation(self, db: Session, *, obj_in: ActivityCreate) -> Activity:
        """Create activity with additional validation."""
        if not obj_in.name.strip():
            raise HTTPException(status_code=422, detail="Activity name cannot be empty")
        if not obj_in.type.strip():
            raise HTTPException(status_code=422, detail="Activity type cannot be empty")
        
        # Add any additional validation logic here
        return super().create(db, obj_in=obj_in)

    def get_by_type(self, db: Session, type: str, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get activities by type."""
        if not type.strip():
            raise HTTPException(status_code=422, detail="Activity type cannot be empty")
        return self.get_multi(db, skip=skip, limit=limit, type=type)

    def get(self, db: Session, id: int) -> Optional[Activity]:
        """Get activity by ID with proper error handling."""
        activity = super().get(db, id=id)
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        return activity

    def get_progress(self, db: Session, activity_id: int) -> List[ActivityProgressResponse]:
        """Get progress for all vocabulary items in an activity."""
        # Get the activity with its vocabularies
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        # Get progress for each vocabulary
        result = []
        for vocab in activity.vocabularies:
            # Get attempt statistics
            attempt_stats = db.query(
                func.count(SessionAttempt.id).label('attempt_count'),
                func.sum(case((SessionAttempt.is_correct, 1), else_=0)).label('correct_count')
            ).filter(
                SessionAttempt.vocabulary_id == vocab.id
            ).first()

            # Get progress record
            progress = db.query(VocabularyProgress).filter(
                VocabularyProgress.vocabulary_id == vocab.id
            ).first()

            # Calculate statistics
            attempt_count = attempt_stats[0] or 0
            correct_count = attempt_stats[1] or 0
            success_rate = correct_count / attempt_count if attempt_count > 0 else 0.0

            result.append(ActivityProgressResponse(
                id=progress.id if progress else None,
                activity_id=activity_id,
                vocabulary_id=vocab.id,
                correct_count=int(correct_count),
                attempt_count=int(attempt_count),
                success_rate=float(success_rate),
                last_attempt=progress.last_reviewed if progress else None
            ))

        return result

class SessionService(BaseService[ActivitySession, SessionCreate, SessionCreate]):
    def __init__(self):
        super().__init__(ActivitySession)

    def create_session(
        self, db: Session, *, activity_id: int, session_data: SessionCreate
    ) -> ActivitySession:
        """Create a new session for an activity."""
        # Verify activity exists
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        # Create session
        db_session = ActivitySession(
            activity_id=activity_id,
            start_time=session_data.start_time,
            end_time=session_data.end_time
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    def get_activity_sessions(
        self, db: Session, activity_id: int, skip: int = 0, limit: int = 100
    ) -> List[ActivitySession]:
        """Get all sessions for an activity."""
        # Verify activity exists
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if not activity:
            return []  # Return empty list for non-existent activity
        return self.get_multi(db, skip=skip, limit=limit, activity_id=activity_id)

    def record_attempt(
        self,
        db: Session,
        *,
        session_id: int,
        vocabulary_id: int,
        is_correct: bool,
        response_time_ms: Optional[int] = None
    ) -> SessionAttempt:
        """Record an attempt in a session."""
        # Verify session exists
        session = db.query(ActivitySession).filter(ActivitySession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        attempt = SessionAttempt(
            session_id=session_id,
            vocabulary_id=vocabulary_id,
            is_correct=is_correct,
            response_time_ms=response_time_ms
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt

# Create service instances
activity_service = ActivityService()
session_service = SessionService()