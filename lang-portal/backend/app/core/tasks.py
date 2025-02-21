"""Background tasks for data cleanup and maintenance."""
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
from app.db.database import SessionLocal
from app.services.activity import activity_service

logger = logging.getLogger(__name__)

def cleanup_expired_activities():
    """Clean up expired activities and their local data."""
    try:
        db = SessionLocal()
        try:
            cleaned = activity_service.cleanup_expired_activities(db)
            if cleaned > 0:
                logger.info(f"Cleaned up {cleaned} expired activities")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to clean up expired activities: {str(e)}")

def schedule_cleanup_tasks(background_tasks: BackgroundTasks):
    """Schedule periodic cleanup tasks."""
    background_tasks.add_task(cleanup_expired_activities) 