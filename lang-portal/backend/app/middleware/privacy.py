"""Privacy middleware for enforcing strict privacy requirements."""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Callable
import re
from app.core.config import settings

class PrivacyMiddleware(BaseHTTPMiddleware):
    """Middleware for enforcing privacy requirements and GDPR compliance."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.sensitive_params = [
            "token", "key", "password", "secret", "auth",
            "session", "tracking", "analytics", "location"
        ]
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process the request and enforce privacy requirements."""
        # Block any external requests
        if not self._is_local_request(request):
            return Response(
                content="This application is designed for local use only",
                status_code=403
            )
        
        # Remove any sensitive query parameters
        if request.query_params:
            filtered_params = self._filter_sensitive_params(dict(request.query_params))
            if filtered_params != dict(request.query_params):
                return Response(
                    content="Request contains sensitive parameters",
                    status_code=400
                )
        
        # Process the request
        response = await call_next(request)
        
        # Add privacy headers
        response.headers["X-Privacy-Mode"] = "strict"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "ambient-light-sensor=(), "
            "autoplay=(), "
            "battery=(), "
            "camera=(), "
            "display-capture=(), "
            "document-domain=(), "
            "encrypted-media=(), "
            "execution-while-not-rendered=(), "
            "execution-while-out-of-viewport=(), "
            "fullscreen=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "interest-cohort=(), "
            "magnetometer=(), "
            "microphone=(), "
            "midi=(), "
            "navigation-override=(), "
            "payment=(), "
            "picture-in-picture=(), "
            "publickey-credentials-get=(), "
            "screen-wake-lock=(), "
            "sync-xhr=(), "
            "usb=(), "
            "web-share=(), "
            "xr-spatial-tracking=()"
        )
        
        # Remove any potential tracking or analytics headers
        headers_to_remove = [
            "Set-Cookie",
            "Cookie",
            "X-Analytics",
            "X-Tracking",
            "X-Real-IP",
            "X-Forwarded-For",
            "X-Forwarded-Proto",
            "X-Forwarded-Host",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
            "Access-Control-Allow-Credentials",
            "Access-Control-Expose-Headers"
        ]
        
        for header in headers_to_remove:
            if header in response.headers:
                del response.headers[header]
        
        # Ensure no sensitive data in response headers
        for header, value in response.headers.items():
            if self._contains_sensitive_data(value):
                response.headers[header] = "[REDACTED]"
        
        return response
    
    def _is_local_request(self, request: Request) -> bool:
        """Check if the request is from localhost."""
        host = request.client.host if request.client else None
        return host in ["127.0.0.1", "localhost", "::1"]
    
    def _filter_sensitive_params(self, params: dict) -> dict:
        """Remove any sensitive parameters from the query string."""
        return {
            k: v for k, v in params.items()
            if not any(sensitive in k.lower() for sensitive in self.sensitive_params)
        }
    
    def _contains_sensitive_data(self, value: str) -> bool:
        """Check if a string contains potentially sensitive data patterns."""
        sensitive_patterns = [
            r"[0-9]{3,}",  # Numbers that could be IDs
            r"[a-fA-F0-9]{32,}",  # MD5/UUID-like strings
            r"eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*",  # JWT-like tokens
            r"[a-zA-Z0-9+/]{32,}={0,2}"  # Base64-like strings
        ]
        return any(re.search(pattern, str(value)) for pattern in sensitive_patterns) 