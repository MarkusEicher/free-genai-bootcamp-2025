from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.vocabulary_group import VocabularyGroup
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
        if not obj_in.vocabulary_group_ids:
            raise HTTPException(
                status_code=400,
                detail={"code": "EMPTY_GROUP_IDS", "message": "At least one vocabulary group must be specified"}
            )
        
        # Verify all groups exist
        groups = db.query(VocabularyGroup).filter(
            VocabularyGroup.id.in_(obj_in.vocabulary_group_ids)
        ).all()
        
        if len(groups) != len(obj_in.vocabulary_group_ids):
            raise HTTPException(
                status_code=404,
                detail={"code": "VOCABULARY_GROUP_NOT_FOUND", "message": "One or more vocabulary groups not found"}
            )
        
        # Create activity
        activity_data = obj_in.dict(exclude={'vocabulary_group_ids'})
        db_obj = Activity(**activity_data)
        
        # Add groups
        for group in groups:
            db_obj.vocabulary_groups.append(group)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: Activity, obj_in: ActivityUpdate
    ) -> Activity:
        """Update activity with vocabulary group handling."""
        update_data = obj_in.dict(exclude_unset=True)
        
        # Handle vocabulary group updates
        if 'vocabulary_group_ids' in update_data:
            group_ids = update_data.pop('vocabulary_group_ids')
            if group_ids is not None:
                if not group_ids:
                    raise HTTPException(
                        status_code=400,
                        detail={"code": "EMPTY_GROUP_IDS", "message": "At least one vocabulary group must be specified"}
                    )
                
                # Verify all groups exist
                groups = db.query(VocabularyGroup).filter(
                    VocabularyGroup.id.in_(group_ids)
                ).all()
                
                if len(groups) != len(group_ids):
                    raise HTTPException(
                        status_code=404,
                        detail={"code": "VOCABULARY_GROUP_NOT_FOUND", "message": "One or more vocabulary groups not found"}
                    )
                
                # Update groups
                db_obj.vocabulary_groups = groups
        
        # Update other fields
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_practice_vocabulary(self, db: Session, activity: Activity) -> List[dict]:
        """Get practice vocabulary for an activity."""
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        return activity.get_practice_vocabulary()

    def get_by_type(self, db: Session, type: str, skip: int = 0, limit: int = 100) -> List[Activity]:
        """Get activities by type."""
        if not type.strip():
            raise HTTPException(status_code=422, detail="Activity type cannot be empty")
        return self.get_multi(db, skip=skip, limit=limit, type=type)

    def get_progress(self, db: Session, activity_id: int) -> List[ActivityProgressResponse]:
        """Get progress for all vocabulary items in an activity."""
        activity = db.query(Activity).filter(Activity.id == activity_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        # Get all vocabulary items from all groups
        vocabulary_ids = []
        for group in activity.vocabulary_groups:
            vocabulary_ids.extend([v.id for v in group.vocabularies])

        # Get progress for each vocabulary
        result = []
        for vocab_id in vocabulary_ids:
            # Get attempt statistics for this activity only
            attempt_stats = db.query(
                func.count(SessionAttempt.id).label('attempt_count'),
                func.sum(case((SessionAttempt.is_correct, 1), else_=0)).label('correct_count')
            ).join(
                ActivitySession, SessionAttempt.session_id == ActivitySession.id
            ).filter(
                SessionAttempt.vocabulary_id == vocab_id,
                ActivitySession.activity_id == activity_id
            ).first()

            # Get progress record
            progress = db.query(VocabularyProgress).filter(
                VocabularyProgress.vocabulary_id == vocab_id
            ).first()

            # Calculate statistics
            attempt_count = attempt_stats[0] or 0
            correct_count = attempt_stats[1] or 0
            success_rate = correct_count / attempt_count if attempt_count > 0 else 0.0

            result.append(ActivityProgressResponse(
                id=progress.id if progress else None,
                activity_id=activity_id,
                vocabulary_id=vocab_id,
                correct_count=int(correct_count),
                attempt_count=int(attempt_count),
                success_rate=float(success_rate),
                last_attempt=progress.last_reviewed if progress else None
            ))

        return result

    def has_vocabulary(self, activity: Activity, vocabulary_id: int) -> bool:
        """Check if a vocabulary belongs to any of the activity's groups."""
        for group in activity.vocabulary_groups:
            for vocab in group.vocabularies:
                if vocab.id == vocabulary_id:
                    return True
        return False

# Keep SessionService unchanged as it works with vocabulary IDs directly
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

        # Verify vocabulary belongs to one of the activity's groups
        vocabulary_ids = []
        for group in session.activity.vocabulary_groups:
            vocabulary_ids.extend([v.id for v in group.vocabularies])
        
        if vocabulary_id not in vocabulary_ids:
            raise HTTPException(
                status_code=400,
                detail={"code": "INVALID_VOCABULARY", "message": "Vocabulary does not belong to activity's groups"}
            )

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