from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.activity import activity_service, session_service
from app.schemas.activity import (
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
    SessionCreate,
    SessionResponse,
    SessionAttemptCreate,
    SessionAttemptResponse,
    ActivityProgressResponse
)

router = APIRouter()

@router.post("/activities", response_model=ActivityResponse)
def create_activity(
    activity: ActivityCreate,
    db: Session = Depends(get_db)
):
    return activity_service.create_with_validation(db, obj_in=activity)

@router.get("/activities", response_model=List[ActivityResponse])
def list_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if type:
        return activity_service.get_by_type(db, type=type, skip=skip, limit=limit)
    return activity_service.get_multi(db, skip=skip, limit=limit)

@router.get("/activities/{activity_id}", response_model=ActivityResponse)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.put("/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    activity_update: ActivityUpdate,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity_service.update(db, db_obj=activity, obj_in=activity_update)

@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    try:
        activity_service.delete(db, id=activity_id)
        return {"message": "Activity deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/activities/{activity_id}/sessions", response_model=SessionResponse)
def create_session(
    activity_id: int,
    session: SessionCreate,
    db: Session = Depends(get_db)
):
    return session_service.create_session(db, activity_id=activity_id, session_data=session)

@router.get("/activities/{activity_id}/sessions", response_model=List[SessionResponse])
def list_activity_sessions(
    activity_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return session_service.get_activity_sessions(db, activity_id=activity_id, skip=skip, limit=limit)

@router.post("/sessions/{session_id}/attempts", response_model=SessionAttemptResponse)
def record_attempt(
    session_id: int,
    attempt: SessionAttemptCreate,
    db: Session = Depends(get_db)
):
    return session_service.record_attempt(
        db,
        session_id=session_id,
        vocabulary_id=attempt.vocabulary_id,
        is_correct=attempt.is_correct,
        response_time_ms=attempt.response_time_ms
    )

@router.get("/activities/{activity_id}/progress", response_model=List[ActivityProgressResponse])
def get_activity_progress(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity_service.get_progress(db, activity_id=activity_id)