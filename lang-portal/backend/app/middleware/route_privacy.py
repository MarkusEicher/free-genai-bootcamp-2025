"""Route-specific privacy middleware for enforcing privacy rules."""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from typing import Callable, Dict, Set
import re
from app.core.config import settings

class RoutePrivacyMiddleware(BaseHTTPMiddleware):
    """Middleware for enforcing route-specific privacy rules."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # Define route patterns and their privacy rules
        self.route_rules: Dict[str, Set[str]] = {
            r"/api/v1/dashboard/.*": {
                "cache_control": "no-store, max-age=0",
                "sanitize_response": True,
                "allow_query_params": {"limit", "offset"}
            },
            r"/api/v1/vocabulary/.*": {
                "cache_control": "private, max-age=300",
                "sanitize_response": True,
                "allow_query_params": {"limit", "offset", "sort", "filter"}
            },
            r"/api/v1/sessions/.*": {
                "cache_control": "no-store, no-cache, must-revalidate",
                "sanitize_response": True,
                "allow_query_params": {"limit"}
            },
            r"/api/v1/activities/.*": {
                "cache_control": "private, max-age=300",
                "sanitize_response": True,
                "allow_query_params": {"limit", "offset", "type"}
            }
        }
        
        # Define sensitive patterns to sanitize in responses
        self.sensitive_patterns = [
            (r'"id":\s*\d+', '"id": "[ID]"'),
            (r'"created_at":\s*"[^"]*"', '"created_at": "[TIMESTAMP]"'),
            (r'"updated_at":\s*"[^"]*"', '"updated_at": "[TIMESTAMP]"'),
            (r'"ip":\s*"[^"]*"', '"ip": "[REDACTED]"'),
            (r'"user_agent":\s*"[^"]*"', '"user_agent": "[REDACTED]"'),
            (r'"session_id":\s*"[^"]*"', '"session_id": "[REDACTED]"'),
            (r'"token":\s*"[^"]*"', '"token": "[REDACTED]"')
        ]
    
    def _get_route_rules(self, path: str) -> Dict[str, any]:
        """Get privacy rules for a specific route."""
        for pattern, rules in self.route_rules.items():
            if re.match(pattern, path):
                return rules
        # Default rules for unmatched routes
        return {
            "cache_control": "no-store",
            "sanitize_response": True,
            "allow_query_params": set()
        }
    
    def _sanitize_query_params(self, params: Dict[str, str], allowed_params: Set[str]) -> Dict[str, str]:
        """Remove disallowed query parameters."""
        return {k: v for k, v in params.items() if k in allowed_params}
    
    def _sanitize_response_data(self, data: str) -> str:
        """Sanitize sensitive information from response data."""
        sanitized = data
        for pattern, replacement in self.sensitive_patterns:
            sanitized = re.sub(pattern, replacement, sanitized)
        return sanitized
    
    async def _handle_options_request(self, request: Request) -> Response:
        """Handle OPTIONS requests with privacy-focused headers."""
        return Response(
            content="",
            status_code=204,
            headers={
                "Allow": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "600",  # 10 minutes
                "Vary": "Origin"
            }
        )
    
    def _add_privacy_headers(self, response: Response, rules: Dict[str, any]) -> None:
        """Add privacy-focused headers to response."""
        response.headers["Cache-Control"] = rules["cache_control"]
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
        
        # Add development mode headers
        if settings.DEV_MODE:
            response.headers["X-Privacy-Mode"] = "development"
            response.headers["X-Cache-Status"] = "bypass"
        else:
            response.headers["X-Privacy-Mode"] = "strict"
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process the request with route-specific privacy rules."""
        # Handle OPTIONS requests
        if request.method == "OPTIONS":
            return await self._handle_options_request(request)
        
        # Get privacy rules for the route
        rules = self._get_route_rules(request.url.path)
        
        # Sanitize query parameters
        if request.query_params:
            allowed_params = rules["allow_query_params"]
            sanitized_params = self._sanitize_query_params(
                dict(request.query_params), allowed_params
            )
            # If any params were removed, return 400
            if len(sanitized_params) != len(request.query_params):
                return Response(
                    content='{"error": "Invalid query parameters"}',
                    status_code=400,
                    media_type="application/json"
                )
        
        # Process the request
        response = await call_next(request)
        
        # Add privacy headers
        self._add_privacy_headers(response, rules)
        
        # Skip sanitization for non-JSON or compressed responses
        if not (
            rules["sanitize_response"] and
            response.headers.get("content-type", "").startswith("application/json") and
            not response.headers.get("content-encoding")
        ):
            return response

        try:
            # Get response body
            body = b""
            async for chunk in response.body_iterator:
                body += chunk

            # Try to sanitize if it's JSON
            try:
                response_text = body.decode('utf-8')
                sanitized_body = self._sanitize_response_data(response_text)
                body = sanitized_body.encode('utf-8')
            except UnicodeDecodeError:
                # Not UTF-8 encoded, return original response
                return Response(
                    content=body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )

            # Create new response with sanitized body
            headers = dict(response.headers)
            
            # Ensure we have exactly one valid Content-Length header
            headers.pop("content-length", None)  # Remove any existing Content-Length headers
            headers.pop("Content-Length", None)  # Remove any capitalized variants
            content_length = str(len(body))  # Calculate new content length
            headers["content-length"] = content_length  # Set single, valid Content-Length header
            
            # Remove any transfer-encoding headers as we're using content-length
            headers.pop("transfer-encoding", None)
            headers.pop("Transfer-Encoding", None)
            
            return Response(
                content=body,
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type
            )
        except Exception:
            # If anything goes wrong, return original response
            return response