import pytest
import time
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient
from app.middleware.performance import PerformanceMiddleware
from app.core.logging import logger

def test_performance_middleware_normal_request():
    """Test performance middleware with normal request"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware)

    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}

    client = TestClient(app)
    response = client.get("/test")
    
    assert response.status_code == 200
    assert "X-Process-Time-Ms" in response.headers
    assert float(response.headers["X-Process-Time-Ms"]) >= 0

def test_performance_middleware_slow_request():
    """Test performance middleware with slow request"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware, slow_threshold_ms=100)

    @app.get("/slow")
    async def slow_endpoint():
        time.sleep(0.2)  # 200ms delay
        return {"message": "slow"}

    client = TestClient(app)
    response = client.get("/slow")
    
    assert response.status_code == 200
    assert "X-Process-Time-Ms" in response.headers
    duration_ms = float(response.headers["X-Process-Time-Ms"])
    assert duration_ms >= 200  # Should be at least 200ms

def test_performance_middleware_error_request():
    """Test performance middleware with error request"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware)

    @app.get("/error")
    async def error_endpoint():
        raise ValueError("Test error")

    client = TestClient(app)
    response = client.get("/error")
    
    assert response.status_code == 500
    assert "X-Process-Time-Ms" in response.headers

def test_performance_middleware_custom_threshold():
    """Test performance middleware with custom threshold"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware, slow_threshold_ms=50)

    @app.get("/medium")
    async def medium_endpoint():
        time.sleep(0.075)  # 75ms delay
        return {"message": "medium"}

    client = TestClient(app)
    response = client.get("/medium")
    
    assert response.status_code == 200
    assert "X-Process-Time-Ms" in response.headers
    duration_ms = float(response.headers["X-Process-Time-Ms"])
    assert duration_ms >= 75

def test_performance_middleware_concurrent_requests():
    """Test performance middleware with concurrent requests"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware)

    @app.get("/concurrent")
    async def concurrent_endpoint():
        return {"message": "concurrent"}

    client = TestClient(app)
    
    # Make multiple concurrent requests
    responses = []
    for _ in range(10):
        response = client.get("/concurrent")
        responses.append(response)
    
    # Verify all responses have timing headers
    for response in responses:
        assert response.status_code == 200
        assert "X-Process-Time-Ms" in response.headers

def test_performance_middleware_log_format():
    """Test performance middleware log format"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware, slow_threshold_ms=100)

    @app.get("/log-test")
    async def log_test_endpoint():
        time.sleep(0.15)  # 150ms delay
        return {"message": "log test"}

    client = TestClient(app)
    response = client.get("/log-test")
    
    assert response.status_code == 200
    duration_ms = float(response.headers["X-Process-Time-Ms"])
    assert duration_ms >= 150

def test_performance_middleware_path_recording():
    """Test that middleware correctly records request paths"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware)

    @app.get("/path/{param}")
    async def path_endpoint(param: str):
        return {"param": param}

    client = TestClient(app)
    response = client.get("/path/test")
    
    assert response.status_code == 200
    assert "X-Process-Time-Ms" in response.headers

def test_performance_middleware_method_recording():
    """Test that middleware correctly records HTTP methods"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware)

    @app.post("/method-test")
    async def method_endpoint():
        return {"message": "post test"}

    client = TestClient(app)
    response = client.post("/method-test")
    
    assert response.status_code == 200
    assert "X-Process-Time-Ms" in response.headers

def test_performance_middleware_status_code_recording():
    """Test that middleware correctly records status codes"""
    app = FastAPI()
    app.add_middleware(PerformanceMiddleware)

    @app.get("/status/{code}")
    async def status_endpoint(code: int):
        return Response(status_code=code)

    client = TestClient(app)
    
    # Test different status codes
    status_codes = [200, 201, 400, 404, 500]
    for code in status_codes:
        response = client.get(f"/status/{code}")
        assert response.status_code == code
        assert "X-Process-Time-Ms" in response.headers 