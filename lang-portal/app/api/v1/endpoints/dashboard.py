from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.responses import BaseResponse
from app.services.dashboard import DashboardService

router = APIRouter()

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)) -> BaseResponse:
    """
    Returns:
        - success_rate: float
        - total_sessions: int
        - active_groups: int
        - current_streak: int
    """
    stats = await DashboardService.get_stats(db)
    return BaseResponse(success=True, data=stats)

@router.get("/progress")
async def get_progress(db: Session = Depends(get_db)) -> BaseResponse:
    """
    Returns:
        - total_words: int
        - studied_words: int
        - mastery_percentage: float
    """
    progress = await DashboardService.get_progress(db)
    return BaseResponse(success=True, data=progress) 