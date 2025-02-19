from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    dashboard,
    sessions,
    vocabulary,
)

api_router = APIRouter()

api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(vocabulary.router, prefix="/vocabulary", tags=["vocabulary"]) 