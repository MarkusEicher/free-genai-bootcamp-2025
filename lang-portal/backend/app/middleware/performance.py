import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        slow_threshold_ms: int = 500  # Define slow requests as taking > 500ms
    ):
        super().__init__(app)
        self.slow_threshold_ms = slow_threshold_ms

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        # Start timer
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000
        
        # Add timing header
        response.headers["X-Process-Time-Ms"] = str(int(duration_ms))
        
        # Log request details
        log_data = {
            "path": request.url.path,
            "method": request.method,
            "duration_ms": int(duration_ms),
            "status_code": response.status_code
        }
        
        # Log slow requests with warning
        if duration_ms > self.slow_threshold_ms:
            logger.warning(
                f"Slow request: {log_data['method']} {log_data['path']} "
                f"took {log_data['duration_ms']}ms"
            )
        else:
            logger.info(
                f"Request: {log_data['method']} {log_data['path']} "
                f"took {log_data['duration_ms']}ms"
            )
        
        return response 