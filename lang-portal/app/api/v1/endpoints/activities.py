from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.responses import BaseResponse
from app.services.activities import ActivityService

router = APIRouter()

@router.get("/list")
async def list_activities(db: Session = Depends(get_db)) -> BaseResponse:
    """Returns list of available activities"""
    activities = await ActivityService.list_activities(db)
    return BaseResponse(success=True, data=activities)

@router.get("/{activity_id}/start")
async def start_activity(
    activity_id: int,
    db: Session = Depends(get_db)
) -> BaseResponse:
    """Returns activity configuration and word set"""
    activity_data = await ActivityService.start_activity(db, activity_id)
    return BaseResponse(success=True, data=activity_data) 