from fastapi import APIRouter
from app.api.v1.endpoints import (
    activities,
    admin,
    dashboard,
    language_pairs,
    languages,
    logs,
    metrics,
    progress,
    sessions,
    statistics,
    vocabularies,
    vocabulary,
    vocabulary_groups
)

api_router = APIRouter()

# Core functionality endpoints
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(vocabulary.router, prefix="/vocabulary", tags=["vocabulary"])
api_router.include_router(vocabularies.router, prefix="/vocabularies", tags=["vocabularies"])
api_router.include_router(vocabulary_groups.router, prefix="/vocabulary-groups", tags=["vocabulary-groups"])
api_router.include_router(language_pairs.router, prefix="/language-pairs", tags=["language-pairs"])
api_router.include_router(languages.router, prefix="/languages", tags=["languages"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(statistics.router, prefix="/statistics", tags=["statistics"])

# System endpoints
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])