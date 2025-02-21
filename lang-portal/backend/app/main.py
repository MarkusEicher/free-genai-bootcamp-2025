from fastapi import FastAPI, Request, Response, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from app.api.v1.api import api_router
from app.middleware.security import SecurityMiddleware
from app.middleware.privacy import PrivacyMiddleware
from app.middleware.route_privacy import RoutePrivacyMiddleware
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from app.core.config import settings
from app.core.tasks import schedule_cleanup_tasks

# Development mode flag
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
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
        redoc_url=None,  # We'll serve our own ReDoc
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

    # Add middleware
    app.add_middleware(SecurityMiddleware)
    app.add_middleware(RoutePrivacyMiddleware)
    
    # Include API router
    app.include_router(api_router, prefix="/api/v1")
    
    # Schedule cleanup tasks on startup
    @app.on_event("startup")
    async def startup_event():
        background_tasks = BackgroundTasks()
        schedule_cleanup_tasks(background_tasks)
        await background_tasks()

    # Serve API documentation in development mode
    if DEV_MODE:
        @app.get("/docs", include_in_schema=False)
        async def custom_swagger_ui_html():
            """Serve Swagger UI documentation in development mode."""
            return get_swagger_ui_html(
                openapi_url="/openapi.json",
                title=app.title + " - API Documentation",
                swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
                swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
                swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png"
            )

        @app.get("/redoc", include_in_schema=False)
        async def redoc_html():
            """Serve ReDoc documentation in development mode."""
            return get_redoc_html(
                openapi_url="/openapi.json",
                title=app.title + " - API Documentation",
                redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
                redoc_favicon_url="https://fastapi.tiangolo.com/img/favicon.png"
            )

        @app.get("/openapi.json", include_in_schema=False)
        async def get_openapi_endpoint():
            """Serve OpenAPI schema in development mode."""
            return get_openapi(
                title=app.title,
                version=app.version,
                description=app.description,
                routes=app.routes,
            )

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

    # Root endpoint with explicit response
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
        """Root endpoint returning basic API information."""
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

    return app

app = create_app()
