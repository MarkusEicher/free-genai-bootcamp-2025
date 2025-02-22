from typing import List, Optional, Dict
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
import os
import shutil

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
from app.core.config import settings

class ActivityService(BaseService[Activity, ActivityCreate, ActivityUpdate]):
    def __init__(self):
        super().__init__(Activity)
        self.data_dir = os.path.join(settings.BACKEND_DIR, "data", "activities")
        os.makedirs(self.data_dir, exist_ok=True)

    def get(self, db: Session, *, id: int) -> Optional[Activity]:
        """Get activity by ID."""
        return super().get(db, id=id)

    def create_with_validation(self, db: Session, *, obj_in: ActivityCreate) -> Activity:
        """Create activity with validation."""
        return super().create_with_validation(db, obj_in=obj_in)

    def update(self, db: Session, *, db_obj: Activity, obj_in: ActivityUpdate) -> Activity:
        """Update activity."""
        return super().update(db, db_obj=db_obj, obj_in=obj_in)

    def delete(self, db: Session, *, id: int) -> Activity:
        """Delete activity."""
        return super().delete(db, id=id)

    def cleanup_expired_activities(self, db: Session) -> int:
        """Clean up expired activities."""
        count = 0
        current_time = datetime.now()
        
        # Find expired activities
        expired = db.query(Activity).filter(
            Activity.scheduled_deletion_at <= current_time
        ).all()
        
        for activity in expired:
            # Clean up local storage
            if activity.local_storage_path:
                try:
                    activity.cleanup_local_data()
                except Exception as e:
                    print(f"Failed to clean local data for activity {activity.id}: {e}")
            
            # Delete from database
            db.delete(activity)
            count += 1
        
        try:
            db.commit()
        except Exception as e:
            print(f"Failed to commit activity cleanup: {e}")
            db.rollback()
            return 0
        
        return count

    def get_with_local_data(self, db: Session, *, id: int) -> Optional[Dict]:
        """Get activity with its local data."""
        activity = self.get(db, id=id)
        if not activity:
            return None
        
        # Update access time
        activity.update_last_accessed()
        db.add(activity)
        db.commit()
        
        # Get base activity data
        data = activity.to_dict(include_private=True)
        
        # Add local data if available
        local_data = activity.load_local_data()
        if local_data:
            data['local_data'] = local_data
        
        return data

    def save_activity_data(self, db: Session, *, id: int, data: Dict) -> bool:
        """Save activity-specific data to local storage."""
        activity = self.get(db, id=id)
        if not activity:
            return False
        
        try:
            activity.save_local_data(data)
            activity.update_last_accessed()
            db.add(activity)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save activity data: {str(e)}"
            )

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

# Create service instance
activity_service = ActivityService()

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

# Create session service instance
session_service = SessionService()