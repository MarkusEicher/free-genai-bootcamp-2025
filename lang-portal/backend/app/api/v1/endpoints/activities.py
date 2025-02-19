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
from app.schemas.vocabulary import VocabularyResponse
from app.core.cache import cache_response
from app.models.activity import Activity, Session as ActivitySession, SessionAttempt

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
    # Validate vocabulary groups
    if not activity.vocabulary_group_ids:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "MISSING_VOCABULARY_GROUPS",
                "message": "At least one vocabulary group must be specified"
            }
        )
    return activity_service.create_with_validation(db, obj_in=activity)

@router.get(
    "/activities",
    response_model=List[ActivityResponse],
    summary="List Activities",
    description="Get a list of all activities."
)
@cache_response(prefix="activity:list", expire=60)
async def list_activities(
    db: Session = Depends(get_db)
):
    return activity_service.get_multi(db)

@router.get(
    "/activities/{activity_id}",
    response_model=ActivityResponse,
    summary="Get Activity",
    description="Get activity details by ID.",
    responses={
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
@cache_response(prefix="activity:detail", expire=60)
async def get_activity(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.get(
    "/activities/{activity_id}/practice",
    response_model=dict,
    summary="Get Practice Vocabulary",
    description="""
    Get vocabulary items for practice from the activity's vocabulary groups.
    
    The items are returned in random order.
    """,
    responses={
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
@cache_response(prefix="activity:practice", expire=60)
async def get_practice_vocabulary(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    items = activity.get_practice_vocabulary()  # Get items directly from activity model
    return {"items": items}

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
async def create_session(
    activity_id: int,
    session_create: SessionCreate,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Create session
    session = ActivitySession(
        activity_id=activity_id,
        start_time=session_create.start_time,
        end_time=session_create.end_time
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Return with empty attempts list and initial stats
    return SessionResponse(
        id=session.id,
        activity_id=activity_id,
        start_time=session.start_time,
        end_time=session.end_time,
        created_at=session.created_at,
        attempts=[],
        correct_count=0,
        incorrect_count=0,
        success_rate=0.0
    )

@router.get(
    "/activities/{activity_id}/sessions",
    response_model=List[SessionResponse],
    summary="List Activity Sessions",
    description="""
    Get a list of practice sessions for an activity.
    
    Sessions are ordered by creation date, with the most recent first.
    """,
    responses={
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
@cache_response(prefix="activity:sessions", expire=60)
async def get_sessions(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return session_service.get_by_activity(db, activity_id=activity_id)

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
async def record_attempt(
    session_id: int,
    attempt: SessionAttemptCreate,
    db: Session = Depends(get_db)
):
    session = session_service.get(db, id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify vocabulary belongs to activity's groups
    activity = activity_service.get(db, id=session.activity_id)
    if not activity_service.has_vocabulary(activity, attempt.vocabulary_id):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_VOCABULARY",
                "message": "Vocabulary does not belong to activity's groups"
            }
        )

    # Create attempt
    db_attempt = SessionAttempt(
        session_id=session_id,
        vocabulary_id=attempt.vocabulary_id,
        is_correct=attempt.is_correct,
        response_time_ms=attempt.response_time_ms
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt

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
async def get_activity_progress(
    activity_id: int,
    db: Session = Depends(get_db)
):
    activity = activity_service.get(db, id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity_service.get_progress(db, activity_id=activity_id)