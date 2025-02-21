from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from app.api.v1.api import api_router
from app.middleware.security import SecurityMiddleware
from app.middleware.privacy import PrivacyMiddleware
from app.middleware.route_privacy import RoutePrivacyMiddleware
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path

# Development mode flag
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# FastAPI app with conditional docs and privacy-focused settings
app = FastAPI(
    title="Language Learning Portal" + (" (Development Mode)" if DEV_MODE else ""),
    description="""
    Language Learning Portal API - Privacy-Focused Local Application
    
    This application is designed to run locally and respects user privacy:
    - No external connections
    - No tracking or analytics
    - No cookies or session data
    - No user data collection
    - Route-specific privacy controls
    - Strict response sanitization
    - Comprehensive privacy headers
    """ + ("""
    
    DEVELOPMENT MODE NOTICE
    ----------------------
    This documentation is only available in development mode.
    - Local access only
    - No data collection or tracking
    - Not available in production
    """ if DEV_MODE else ""),
    version="0.1.0",
    docs_url=None,  # We'll serve our own docs
    redoc_url="/redoc" if DEV_MODE else None,
    openapi_url="/openapi.json" if DEV_MODE else None,
    openapi_tags=[
        {
            "name": "Privacy",
            "description": "This API follows strict privacy guidelines and GDPR compliance. "
                         "Each route has specific privacy rules for caching, allowed parameters, "
                         "and response sanitization."
        }
    ]
)

# Mount static files for Swagger UI in development mode
if DEV_MODE:
    static_dir = Path(__file__).parent.parent / "static"
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        return get_swagger_ui_html(
            openapi_url="/openapi.json",
            title=app.title + " - Swagger UI",
            swagger_js_url="/static/swagger-ui/swagger-ui-bundle.js",
            swagger_css_url="/static/swagger-ui/swagger-ui.css",
            swagger_favicon_url="/static/swagger-ui/favicon.png"
        )

# Add middleware in order of execution
app.add_middleware(PrivacyMiddleware)  # Global privacy checks
app.add_middleware(RoutePrivacyMiddleware)  # Route-specific privacy rules
app.add_middleware(SecurityMiddleware)  # Security headers and checks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Health check endpoint
@app.get("/health", 
    summary="Health Check",
    description="Returns the health status of the API.",
    response_description="Basic health information without sensitive data",
    responses={
        200: {
            "description": "Health status",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "mode": "development" if DEV_MODE else "production"
                    }
                }
            }
        }
    }
)
async def health_check():
    return {
        "status": "healthy",
        "mode": "development" if DEV_MODE else "production"
    }

# Root endpoint
@app.get("/", 
    summary="Root Endpoint",
    description="Returns a welcome message and basic API information.",
    response_description="Welcome message and mode information",
    responses={
        200: {
            "description": "Welcome message",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Welcome to the Language Learning Portal API",
                        "mode": "development" if DEV_MODE else "production"
                    }
                }
            }
        }
    }
)
async def root():
    return {
        "message": "Welcome to the Language Learning Portal API",
        "mode": "development" if DEV_MODE else "production"
    }

# Redirect common paths to their API v1 equivalents
@app.get("/vocabulary")
async def redirect_vocabulary():
    return RedirectResponse(url="/api/v1/vocabulary/")

@app.get("/dashboard")
async def redirect_dashboard():
    return RedirectResponse(url="/api/v1/dashboard/")

@app.get("/admin")
async def redirect_admin():
    return RedirectResponse(url="/api/v1/admin/")
