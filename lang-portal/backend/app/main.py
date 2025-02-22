from fastapi import FastAPI, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from app.api.v1.api import api_router
from app.middleware.security import SecurityMiddleware
from app.middleware.privacy import PrivacyMiddleware
from app.middleware.route_privacy import RoutePrivacyMiddleware
import os
from pathlib import Path
from app.core.config import settings

# Development mode flag
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Language Learning Portal API",
        description="Privacy-focused language learning API",
        version="1.0.0",
        docs_url=None,  # We'll serve these manually
        redoc_url=None,
    )

    # Root endpoint handler
    @app.get("/")
    async def root():
        """Redirect root endpoint to documentation."""
        return RedirectResponse(url="/docs" if DEV_MODE else "/api/v1")

    # Add security middleware
    app.add_middleware(SecurityMiddleware)
    app.add_middleware(PrivacyMiddleware)
    app.add_middleware(RoutePrivacyMiddleware)

    # Include API router
    app.include_router(api_router, prefix="/api/v1")

    # Serve API documentation in development mode
    if DEV_MODE:
        @app.get("/docs", include_in_schema=False)
        async def custom_swagger_ui_html():
            """Serve Swagger UI documentation in development mode."""
            swagger_ui = get_swagger_ui_html(
                openapi_url="/openapi.json",
                title=app.title + " - API Documentation",
                swagger_js_url="/static/swagger-ui/swagger-ui-bundle.js",
                swagger_css_url="/static/swagger-ui/swagger-ui.css",
                swagger_favicon_url="/static/swagger-ui/favicon.png",
            )
            return HTMLResponse(content=swagger_ui.body.decode(), media_type="text/html")

        @app.get("/redoc", include_in_schema=False)
        async def redoc_html():
            """Serve ReDoc documentation in development mode."""
            redoc = get_redoc_html(
                openapi_url="/openapi.json",
                title=app.title + " - API Documentation",
                redoc_js_url="/static/redoc/redoc.standalone.js",
                redoc_favicon_url="/static/redoc/favicon.png",
            )
            return HTMLResponse(content=redoc.body.decode(), media_type="text/html")

        # Mount static files for documentation
        static_path = Path(__file__).parent.parent / "static"
        app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

        @app.get("/openapi.json", include_in_schema=False)
        async def get_openapi_json():
            """Serve OpenAPI schema."""
            return JSONResponse(
                get_openapi(
                    title=app.title,
                    version=app.version,
                    description=app.description,
                    routes=app.routes,
                ),
                status_code=200,
            )

    return app

app = create_app()
