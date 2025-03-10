from typing import List
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from sqlalchemy.orm import Session
import time
from datetime import datetime, timedelta
import logging

from app.db.database import get_db
from app.services.dashboard import dashboard_service
from app.schemas.dashboard import (
    DashboardStats,
    DashboardProgress,
    LatestSession
)
from app.core.cache import cache_response

logger = logging.getLogger(__name__)

router = APIRouter()

# Rate limiting settings
RATE_LIMIT_REQUESTS = 60  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds
request_timestamps = {}

def check_rate_limit(request: Request):
    """Check if request is within rate limits."""
    now = time.time()
    client = request.client.host
    
    # Clean old timestamps
    request_timestamps[client] = [ts for ts in request_timestamps.get(client, [])
                                if now - ts < RATE_LIMIT_WINDOW]
    
    # Check rate limit
    if len(request_timestamps.get(client, [])) >= RATE_LIMIT_REQUESTS:
        logger.warning(f"Rate limit exceeded for {client}")
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
    
    # Add current timestamp
    request_timestamps.setdefault(client, []).append(now)

@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get Dashboard Statistics",
    description="""
    Retrieve overall dashboard statistics including:
    - Success rate across all activities
    - Total number of study sessions
    - Number of active activities
    - Number of active vocabulary groups
    - Current and longest study streaks
    
    Response is cached for 5 minutes.
    """,
    response_description="Dashboard statistics",
    responses={
        200: {
            "description": "Successfully retrieved dashboard statistics",
            "content": {
                "application/json": {
                    "example": {
                        "success_rate": 0.75,
                        "study_sessions_count": 100,
                        "active_activities_count": 5,
                        "active_groups_count": 3,
                        "study_streak": {
                            "current_streak": 7,
                            "longest_streak": 14
                        }
                    }
                }
            }
        }
    }
)
@cache_response(prefix="dashboard:stats", expire=300)
async def get_dashboard_stats(request: Request, db: Session = Depends(get_db)):
    """Get dashboard statistics with rate limiting."""
    try:
        check_rate_limit(request)
        return dashboard_service.get_stats(db)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.get(
    "/progress",
    response_model=DashboardProgress,
    summary="Get Learning Progress",
    description="""
    Retrieve learning progress statistics including:
    - Total number of vocabulary items
    - Number of items studied at least once
    - Number of mastered items (success rate >= 80%)
    - Overall progress percentage
    
    The progress percentage is calculated as (studied_items / total_items) * 100.
    An item is considered mastered when its success rate is 80% or higher.
    
    Response is cached for 5 minutes.
    """,
    response_description="Learning progress statistics",
    responses={
        200: {
            "description": "Successfully retrieved learning progress",
            "content": {
                "application/json": {
                    "example": {
                        "total_items": 100,
                        "studied_items": 75,
                        "mastered_items": 30,
                        "progress_percentage": 75.0
                    }
                }
            }
        }
    }
)
@cache_response(prefix="dashboard:progress", expire=300)
async def get_dashboard_progress(request: Request, db: Session = Depends(get_db)):
    """Get learning progress with rate limiting."""
    try:
        check_rate_limit(request)
        return dashboard_service.get_progress(db)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in get_dashboard_progress: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.get(
    "/latest-sessions",
    response_model=List[LatestSession],
    summary="Get Latest Study Sessions",
    description="""
    Retrieve the most recent study sessions, ordered by start time (descending).
    
    Parameters:
    - limit: Number of sessions to return (default: 5, max: 20)
    
    Each session includes:
    - Activity name and type
    - Start and end times
    - Success rate
    - Correct and incorrect answer counts
    
    Response is cached for 1 minute.
    """,
    response_description="List of recent study sessions",
    responses={
        200: {
            "description": "Successfully retrieved latest sessions",
            "content": {
                "application/json": {
                    "example": [{
                        "activity_name": "Basic Vocabulary",
                        "activity_type": "flashcard",
                        "start_time": "2024-02-17T14:30:00Z",
                        "end_time": "2024-02-17T14:45:00Z",
                        "success_rate": 0.85,
                        "correct_count": 17,
                        "incorrect_count": 3
                    }]
                }
            }
        },
        422: {
            "description": "Validation Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [{
                            "loc": ["query", "limit"],
                            "msg": "ensure this value is greater than or equal to 1",
                            "type": "value_error.number.not_ge"
                        }]
                    }
                }
            }
        }
    }
)
@cache_response(prefix="dashboard:sessions", expire=60, include_query_params=True)
async def get_latest_sessions(
    request: Request,
    limit: int = Query(
        5,
        ge=1,
        le=20,
        description="Number of sessions to return (max: 20)"
    ),
    db: Session = Depends(get_db)
):
    """Get latest sessions with rate limiting."""
    try:
        check_rate_limit(request)
        return dashboard_service.get_latest_sessions(db, limit)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in get_latest_sessions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )