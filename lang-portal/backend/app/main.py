from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.api.v1.endpoints import (
    languages,
    vocabulary_groups,
    progress,
    statistics,
    vocabulary,
    activities,
    dashboard,
    admin
)

app = FastAPI(
    title="Language Learning Portal",
    description="Backend API for the Language Learning Portal",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(languages.router, prefix="/api/v1", tags=["languages"])
app.include_router(vocabulary_groups.router, prefix="/api/v1", tags=["vocabulary-groups"])
app.include_router(progress.router, prefix="/api/v1", tags=["progress"])
app.include_router(statistics.router, prefix="/api/v1/statistics", tags=["statistics"])
app.include_router(vocabulary.router, prefix="/api/v1/vocabularies", tags=["vocabulary"])
app.include_router(activities.router, prefix="/api/v1", tags=["activities"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0"
    }

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")
