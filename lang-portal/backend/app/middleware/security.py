"""Security middleware for privacy and security headers."""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Callable
from app.core.config import settings
import os

class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for handling security and privacy headers."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process the request and add security headers."""
        # Check for local-only access
        origin = request.headers.get("Origin", "")
        if origin and not origin.startswith(("http://localhost:", "http://127.0.0.1:")):
            return Response(
                content="Access denied: Local-only application",
                status_code=403
            )
        
        # Process the request
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin, same-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Add Content Security Policy based on mode
        if self.dev_mode and request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            # Development mode with Swagger UI support
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' https://fastapi.tiangolo.com data:; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "font-src 'self' data:;"
            )
        else:
            # Production mode or non-docs endpoints
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "img-src 'self' data:; "
                "style-src 'self' 'unsafe-inline'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
            )
        
        # Remove any tracking or analytics headers
        headers_to_remove = [
            "Set-Cookie",
            "X-Analytics",
            "X-Tracking",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers"
        ]
        
        for header in headers_to_remove:
            if header in response.headers:
                del response.headers[header]
        
        return response 