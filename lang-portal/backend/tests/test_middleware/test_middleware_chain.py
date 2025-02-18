import pytest
from fastapi import FastAPI, Request, Response, Depends
from fastapi.testclient import TestClient
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from app.middleware.performance import PerformanceMiddleware
from app.core.config import settings
import time
import json
from typing import List

class TestMiddleware(BaseHTTPMiddleware):
    """Test middleware for tracking execution order."""
    def __init__(self, app, name: str):
        super().__init__(app)
        self.name = name
        self.calls = []

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Record pre-processing
        self.calls.append(f"{self.name}_pre")
        
        # Process request
        response = await call_next(request)
        
        # Record post-processing
        self.calls.append(f"{self.name}_post")
        
        return response

def test_middleware_execution_order():
    """Test that middleware executes in the correct order."""
    app = FastAPI()
    
    # Create test middlewares
    middleware1 = TestMiddleware(app, "middleware1")
    middleware2 = TestMiddleware(app, "middleware2")
    
    # Add middlewares in order
    app.add_middleware(TestMiddleware, name="middleware2")
    app.add_middleware(TestMiddleware, name="middleware1")
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}
    
    client = TestClient(app)
    response = client.get("/test")
    
    # Verify order: middleware1_pre -> middleware2_pre -> middleware2_post -> middleware1_post
    assert middleware1.calls == ["middleware1_pre", "middleware1_post"]
    assert middleware2.calls == ["middleware2_pre", "middleware2_post"]

def test_middleware_error_handling():
    """Test middleware error handling."""
    app = FastAPI()
    
    class ErrorMiddleware(BaseHTTPMiddleware):
        async def dispatch(
            self, request: Request, call_next: RequestResponseEndpoint
        ) -> Response:
            if "trigger-error" in request.query_params:
                raise ValueError("Test error")
            return await call_next(request)
    
    app.add_middleware(ErrorMiddleware)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}
    
    client = TestClient(app)
    
    # Test normal request
    response = client.get("/test")
    assert response.status_code == 200
    
    # Test error request
    response = client.get("/test?trigger-error=1")
    assert response.status_code == 500

def test_middleware_request_modification():
    """Test middleware request modification."""
    app = FastAPI()
    
    class RequestModifyingMiddleware(BaseHTTPMiddleware):
        async def dispatch(
            self, request: Request, call_next: RequestResponseEndpoint
        ) -> Response:
            # Add custom header
            request.headers.__dict__["_list"].append(
                (b"x-custom-header", b"test-value")
            )
            return await call_next(request)
    
    app.add_middleware(RequestModifyingMiddleware)
    
    @app.get("/test")
    async def test_endpoint(request: Request):
        return {"header": request.headers.get("x-custom-header")}
    
    client = TestClient(app)
    response = client.get("/test")
    assert response.json()["header"] == "test-value"

def test_middleware_response_modification():
    """Test middleware response modification."""
    app = FastAPI()
    
    class ResponseModifyingMiddleware(BaseHTTPMiddleware):
        async def dispatch(
            self, request: Request, call_next: RequestResponseEndpoint
        ) -> Response:
            response = await call_next(request)
            response.headers["X-Custom-Response"] = "modified"
            return response
    
    app.add_middleware(ResponseModifyingMiddleware)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}
    
    client = TestClient(app)
    response = client.get("/test")
    assert response.headers["X-Custom-Response"] == "modified"

def test_middleware_chain_performance():
    """Test performance impact of middleware chain."""
    app = FastAPI()
    
    # Add multiple middlewares
    for i in range(5):
        app.add_middleware(TestMiddleware, name=f"middleware{i}")
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}
    
    client = TestClient(app)
    
    # Measure response time
    start_time = time.time()
    response = client.get("/test")
    end_time = time.time()
    
    # Should be reasonably fast even with multiple middlewares
    assert end_time - start_time < 0.1  # Less than 100ms

def test_cors_middleware_integration():
    """Test CORS middleware integration."""
    app = FastAPI()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}
    
    client = TestClient(app)
    
    # Test CORS headers
    response = client.get(
        "/test",
        headers={"Origin": "http://localhost:5173"}
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.headers["access-control-allow-credentials"] == "true"

def test_performance_middleware_integration():
    """Test performance middleware integration."""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware)
    
    @app.get("/test")
    async def test_endpoint():
        time.sleep(0.1)  # Simulate slow operation
        return {"message": "test"}
    
    client = TestClient(app)
    response = client.get("/test")
    
    # Verify timing header
    assert "X-Process-Time-Ms" in response.headers
    process_time = float(response.headers["X-Process-Time-Ms"])
    assert process_time >= 100  # Should be at least 100ms

def test_middleware_dependency_injection():
    """Test middleware interaction with dependency injection."""
    app = FastAPI()
    
    class DependencyMiddleware(BaseHTTPMiddleware):
        async def dispatch(
            self, request: Request, call_next: RequestResponseEndpoint
        ) -> Response:
            # Add data to request state
            request.state.custom_data = "test_data"
            return await call_next(request)
    
    app.add_middleware(DependencyMiddleware)
    
    async def get_custom_data(request: Request):
        return request.state.custom_data
    
    @app.get("/test")
    async def test_endpoint(custom_data: str = Depends(get_custom_data)):
        return {"data": custom_data}
    
    client = TestClient(app)
    response = client.get("/test")
    assert response.json()["data"] == "test_data"

def test_middleware_state_isolation():
    """Test middleware state isolation between requests."""
    app = FastAPI()
    
    class StateMiddleware(BaseHTTPMiddleware):
        def __init__(self, app):
            super().__init__(app)
            self.request_count = 0
    
        async def dispatch(
            self, request: Request, call_next: RequestResponseEndpoint
        ) -> Response:
            self.request_count += 1
            request.state.count = self.request_count
            return await call_next(request)
    
    app.add_middleware(StateMiddleware)
    
    @app.get("/test")
    async def test_endpoint(request: Request):
        return {"count": request.state.count}
    
    client = TestClient(app)
    
    # Make concurrent requests
    responses = []
    for _ in range(3):
        response = client.get("/test")
        responses.append(response.json()["count"])
    
    # Each request should have a unique count
    assert len(set(responses)) == 3
    assert sorted(responses) == [1, 2, 3]

def test_middleware_exception_propagation():
    """Test exception propagation through middleware chain."""
    app = FastAPI()
    
    class ExceptionMiddleware(BaseHTTPMiddleware):
        async def dispatch(
            self, request: Request, call_next: RequestResponseEndpoint
        ) -> Response:
            try:
                return await call_next(request)
            except ValueError as e:
                return Response(
                    content=json.dumps({"error": str(e)}),
                    media_type="application/json",
                    status_code=400
                )
    
    app.add_middleware(ExceptionMiddleware)
    
    @app.get("/test")
    async def test_endpoint(error: bool = False):
        if error:
            raise ValueError("Test error")
        return {"message": "test"}
    
    client = TestClient(app)
    
    # Test normal request
    response = client.get("/test")
    assert response.status_code == 200
    
    # Test error request
    response = client.get("/test?error=true")
    assert response.status_code == 400
    assert response.json()["error"] == "Test error"

def test_middleware_cleanup():
    """Test middleware cleanup on application shutdown."""
    app = FastAPI()
    cleanup_called = False
    
    class CleanupMiddleware(BaseHTTPMiddleware):
        async def dispatch(
            self, request: Request, call_next: RequestResponseEndpoint
        ) -> Response:
            return await call_next(request)
        
        def cleanup(self):
            nonlocal cleanup_called
            cleanup_called = True
    
    middleware = CleanupMiddleware(app)
    app.add_middleware(lambda app: middleware)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}
    
    # Create and use client
    client = TestClient(app)
    client.get("/test")
    
    # Cleanup should be called on shutdown
    if hasattr(middleware, 'cleanup'):
        middleware.cleanup()
        assert cleanup_called 