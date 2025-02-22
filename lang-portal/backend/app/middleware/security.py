"""Security middleware for privacy and security headers."""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Callable
from app.core.config import settings
import os
import re

class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for handling security and privacy headers."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"
        # Define documentation endpoints
        self.doc_endpoints = {"/docs", "/redoc", "/openapi.json"}
        self.doc_static_pattern = re.compile(r"^/static/(swagger-ui|redoc)/.*$")
    
    def _is_doc_endpoint(self, path: str) -> bool:
        """Check if the path is a documentation endpoint."""
        return path in self.doc_endpoints or bool(self.doc_static_pattern.match(path))
    
    def _is_local_request(self, request: Request) -> bool:
        """Check if the request is from localhost."""
        host = request.client.host if request.client else None
        origin = request.headers.get("Origin", "")
        return (
            host in ["127.0.0.1", "localhost", "::1"] or
            origin.startswith(("http://localhost:", "http://127.0.0.1:"))
        )
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process the request and add security headers."""
        # Check if this is a documentation endpoint
        is_docs_endpoint = self._is_doc_endpoint(request.url.path)
        
        # For non-documentation endpoints, enforce local-only access
        if not is_docs_endpoint and not self._is_local_request(request):
            return Response(
                content="Access denied: Local-only application",
                status_code=403
            )
        
        # Process the request
        response = await call_next(request)
        
        # Preserve CORS headers if they exist
        cors_headers = {
            k: v for k, v in response.headers.items()
            if k.lower().startswith("access-control-")
        }
        
        if is_docs_endpoint:
            # For documentation endpoints, only add essential security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            if self.dev_mode:
                # Development mode with Swagger UI support
                response.headers["Content-Security-Policy"] = (
                    "default-src 'self'; "
                    "img-src 'self' data:; "
                    "style-src 'self' 'unsafe-inline'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                    "font-src 'self' data:;"
                )
            # Restore CORS headers
            response.headers.update(cors_headers)
            return response
        
        # Add security headers for non-documentation endpoints
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Use only standardized Permissions-Policy directives
        response.headers["Permissions-Policy"] = (
            "camera=(), "
            "microphone=(), "
            "geolocation=(), "
            "payment=(), "
            "usb=(), "
            "interest-cohort=()"
        )
        
        # Production mode CSP
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data:; "
            "style-src 'self'; "
            "script-src 'self';"
        )
        
        # Remove tracking headers but preserve CORS
        headers_to_remove = [
            "Set-Cookie",
            "X-Analytics",
            "X-Tracking"
        ]
        
        for header in headers_to_remove:
            if header in response.headers:
                del response.headers[header]
        
        # Restore CORS headers
        response.headers.update(cors_headers)
        
        return response