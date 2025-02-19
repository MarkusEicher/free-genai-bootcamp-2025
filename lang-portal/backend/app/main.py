from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from app.api.v1.api import api_router
from app.middleware.security import SecurityMiddleware
import os
from pathlib import Path

# Development mode flag
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# FastAPI app with conditional docs
app = FastAPI(
    title="Language Learning Portal" + (" (Development Mode)" if DEV_MODE else ""),
    description="""
    Language Learning Portal API
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
    openapi_url="/openapi.json" if DEV_MODE else None
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

# Middleware to restrict docs access
@app.middleware("http")
async def restrict_docs_access(request: Request, call_next):
    # Block docs in non-dev mode
    if not DEV_MODE and any(path in request.url.path for path in ["/docs", "/redoc", "/openapi.json"]):
        return JSONResponse(
            status_code=404,
            content={"detail": "Not found"}
        )
    
    # Only allow local access in dev mode
    if DEV_MODE and any(path in request.url.path for path in ["/docs", "/redoc", "/openapi.json"]):
        if not request.client.host in ["127.0.0.1", "localhost"]:
            return JSONResponse(
                status_code=403,
                content={"detail": "Development documentation only available locally"}
            )
    
    return await call_next(request)

# Add security headers for docs
@app.middleware("http")
async def add_docs_security_headers(request: Request, call_next):
    response = await call_next(request)
    if DEV_MODE and any(path in request.url.path for path in ["/docs", "/redoc", "/openapi.json"]):
        response.headers["X-Development-Mode"] = "true"
        response.headers["Cache-Control"] = "no-store, max-age=0"
        response.headers["Pragma"] = "no-cache"
    return response

# Add security middleware
app.add_middleware(SecurityMiddleware)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Health check endpoint
@app.get("/health", 
    summary="Health Check",
    description="Returns the health status of the API.")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0"
    }

# Root endpoint
@app.get("/", 
    summary="Root Endpoint",
    description="Returns a welcome message and basic API information.")
async def root():
    return {
        "message": "Welcome to the Language Learning Portal API",
        "version": "0.1.0",
        "mode": "Development" if DEV_MODE else "Production"
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
