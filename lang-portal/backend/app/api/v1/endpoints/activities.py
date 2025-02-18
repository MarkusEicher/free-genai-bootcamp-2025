from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, UTC

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
from app.core.cache import cache_response

router = APIRouter()

@router.post(
    "/activities",
    response_model=ActivityResponse,
    summary="Create Activity",
    description="""
    Create a new activity with vocabulary groups.
    
    The activity must be associated with at least one vocabulary group.
    Practice direction can be either 'forward' or 'reverse'.
    """,
    responses={
        200: {
            "description": "Activity created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "type": "flashcard",
                        "name": "Basic Verbs",
                        "description": "Practice common verbs",
                        "practice_direction": "forward",
                        "created_at": "2024-03-21T10:00:00Z",
                        "vocabulary_groups": [
                            {"id": 1, "name": "Common Verbs"}
                        ]
                    }
                }
            }
        },
        400: {
            "description": "Validation Error",
            "content": {
                "application/json": {
                    "example": {
                        "code": "EMPTY_GROUP_IDS",
                        "message": "At least one vocabulary group must be specified"
                    }
                }
            }
        },
        422: {
            "description": "Validation Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["body", "practice_direction"],
                                "msg": "practice_direction must be 'forward' or 'reverse'",
                                "type": "value_error"
                            }
                        ]
                    }
                }
            }
        }
    }
)
def create_activity(
    activity: ActivityCreate,
    db: Session = Depends(get_db)
):
    return activity_service.create_with_validation(db, obj_in=activity)

@router.get(
    "/activities",
    response_model=List[ActivityResponse],
    summary="List Activities",
    description="List activities with optional type filtering and pagination.",
    responses={
        200: {
            "description": "List of activities",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "type": "flashcard",
                            "name": "Basic Verbs",
                            "description": "Practice common verbs",
                            "practice_direction": "forward",
                            "created_at": "2024-03-21T10:00:00Z",
                            "vocabulary_groups": [
                                {"id": 1, "name": "Common Verbs"}
                            ]
                        }
                    ]
                }
            }
        }
    }
)
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
    """
    Get activity details including associated vocabulary groups.
    """
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.get(
    "/activities/{activity_id}/practice",
    summary="Get Practice Vocabulary",
    description="""
    Get practice vocabulary for an activity.
    
    Returns vocabulary items in the correct direction based on activity's practice_direction.
    Items are retrieved from all associated vocabulary groups.
    """,
    responses={
        200: {
            "description": "Practice vocabulary items",
            "content": {
                "application/json": {
                    "example": {
                        "items": [
                            {
                                "word": "run",
                                "translation": "laufen",
                                "vocabulary_id": 1,
                                "language_pair_id": 1
                            }
                        ]
                    }
                }
            }
        },
        404: {
            "description": "Activity not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Activity not found"
                    }
                }
            }
        }
    }
)
@cache_response(prefix="activity:practice", expire=300)
def get_practice_vocabulary(activity_id: int, db: Session = Depends(get_db)):
    return {
        "items": activity_service.get_practice_vocabulary(db, activity_id=activity_id)
    }

@router.put(
    "/activities/{activity_id}",
    response_model=ActivityResponse,
    summary="Update Activity",
    description="""
    Update activity details including:
    - Basic activity information
    - Practice direction
    - Associated vocabulary groups
    """,
    responses={
        200: {
            "description": "Activity updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "type": "flashcard",
                        "name": "Updated Verbs",
                        "description": "Updated description",
                        "practice_direction": "reverse",
                        "created_at": "2024-03-21T10:00:00Z",
                        "vocabulary_groups": [
                            {"id": 1, "name": "Common Verbs"},
                            {"id": 2, "name": "Advanced Verbs"}
                        ]
                    }
                }
            }
        },
        404: {
            "description": "Activity not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Activity not found"
                    }
                }
            }
        }
    }
)
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
    """Delete activity and all its associations."""
    try:
        activity_service.delete(db, id=activity_id)
        return {"message": "Activity deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/activities/{activity_id}/sessions",
    response_model=SessionResponse,
    summary="Create Practice Session",
    description="""
    Create a new practice session for an activity.
    
    The session will use vocabulary from the activity's associated groups
    in the specified practice direction.
    """,
    responses={
        200: {
            "description": "Session created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "activity_id": 1,
                        "start_time": "2024-03-21T10:00:00Z",
                        "end_time": None,
                        "created_at": "2024-03-21T10:00:00Z",
                        "attempts": [],
                        "correct_count": 0,
                        "incorrect_count": 0,
                        "success_rate": 0.0
                    }
                }
            }
        },
        404: {
            "description": "Activity not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Activity not found"
                    }
                }
            }
        }
    }
)
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
    """List all practice sessions for an activity."""
    return session_service.get_activity_sessions(db, activity_id=activity_id, skip=skip, limit=limit)

@router.post(
    "/sessions/{session_id}/attempts",
    response_model=SessionAttemptResponse,
    summary="Record Practice Attempt",
    description="""
    Record a practice attempt in a session.
    
    The vocabulary must belong to one of the activity's vocabulary groups.
    """,
    responses={
        200: {
            "description": "Attempt recorded successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "session_id": 1,
                        "vocabulary_id": 1,
                        "is_correct": True,
                        "response_time_ms": 1500,
                        "created_at": "2024-03-21T10:00:00Z"
                    }
                }
            }
        },
        400: {
            "description": "Invalid vocabulary",
            "content": {
                "application/json": {
                    "example": {
                        "code": "INVALID_VOCABULARY",
                        "message": "Vocabulary does not belong to activity's groups"
                    }
                }
            }
        },
        404: {
            "description": "Session not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Session not found"
                    }
                }
            }
        }
    }
)
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

@router.get(
    "/activities/{activity_id}/progress",
    response_model=List[ActivityProgressResponse],
    summary="Get Activity Progress",
    description="""
    Get progress statistics for all vocabulary items in an activity's groups.
    
    Returns progress information for each vocabulary item, including:
    - Success rate
    - Attempt counts
    - Last attempt timestamp
    """,
    responses={
        200: {
            "description": "Activity progress statistics",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "activity_id": 1,
                            "vocabulary_id": 1,
                            "correct_count": 8,
                            "attempt_count": 10,
                            "success_rate": 0.8,
                            "last_attempt": "2024-03-21T10:00:00Z"
                        }
                    ]
                }
            }
        },
        404: {
            "description": "Activity not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Activity not found"
                    }
                }
            }
        }
    }
)
@cache_response(prefix="activity:progress", expire=60)
def get_activity_progress(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity_service.get_progress(db, activity_id=activity_id)