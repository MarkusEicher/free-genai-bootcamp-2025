import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from redis.exceptions import ConnectionError
from unittest.mock import patch
from app.core.cache import redis_client

def test_basic_health_check(client: TestClient):
    """Test basic health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_detailed_health_check(client: TestClient, db_session: Session):
    """Test detailed health check with all components."""
    response = client.get("/health/detailed")
    assert response.status_code == 200
    data = response.json()
    
    # Check database status
    assert "database" in data
    assert data["database"]["status"] == "healthy"
    assert "latency_ms" in data["database"]
    
    # Check Redis status
    assert "cache" in data
    assert data["cache"]["status"] == "healthy"
    assert "latency_ms" in data["cache"]
    
    # Check disk usage
    assert "disk" in data
    assert "free_space_mb" in data["disk"]
    assert "total_space_mb" in data["disk"]
    
    # Check memory usage
    assert "memory" in data
    assert "used_mb" in data["memory"]
    assert "total_mb" in data["memory"]
    assert "percentage" in data["memory"]

def test_database_health(client: TestClient, db_session: Session):
    """Test database health check."""
    response = client.get("/health/database")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "connection_pool" in data
    assert "active_connections" in data
    assert "max_connections" in data

def test_cache_health(client: TestClient):
    """Test cache health check."""
    response = client.get("/health/cache")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "used_memory_mb" in data
    assert "total_memory_mb" in data
    assert "hit_rate" in data

def test_cache_failure_handling(client: TestClient):
    """Test cache failure handling in health check."""
    with patch('redis.Redis.ping', side_effect=ConnectionError("Connection failed")):
        response = client.get("/health/cache")
        assert response.status_code == 503  # Service Unavailable
        data = response.json()
        assert data["status"] == "unhealthy"
        assert "error" in data
        assert "Connection failed" in data["error"]

def test_database_failure_handling(client: TestClient, db_session: Session):
    """Test database failure handling in health check."""
    with patch('sqlalchemy.orm.Session.execute', side_effect=Exception("DB Error")):
        response = client.get("/health/database")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert "error" in data

def test_system_metrics(client: TestClient):
    """Test system metrics endpoint."""
    response = client.get("/health/metrics")
    assert response.status_code == 200
    data = response.json()
    
    # CPU metrics
    assert "cpu" in data
    assert "usage_percent" in data["cpu"]
    assert "load_average" in data["cpu"]
    
    # Memory metrics
    assert "memory" in data
    assert "used_percent" in data["memory"]
    assert "available_mb" in data["memory"]
    
    # Disk metrics
    assert "disk" in data
    assert "used_percent" in data["disk"]
    assert "free_mb" in data["disk"]
    
    # Network metrics
    assert "network" in data
    assert "bytes_sent" in data["network"]
    assert "bytes_received" in data["network"]

def test_component_dependencies(client: TestClient):
    """Test component dependencies health check."""
    response = client.get("/health/dependencies")
    assert response.status_code == 200
    data = response.json()
    
    # Database dependency
    assert "database" in data
    assert "status" in data["database"]
    assert "version" in data["database"]
    
    # Redis dependency
    assert "redis" in data
    assert "status" in data["redis"]
    assert "version" in data["redis"]

def test_application_info(client: TestClient):
    """Test application information endpoint."""
    response = client.get("/health/info")
    assert response.status_code == 200
    data = response.json()
    
    assert "version" in data
    assert "environment" in data
    assert "start_time" in data
    assert "uptime_seconds" in data
    assert "python_version" in data

def test_resource_usage_thresholds(client: TestClient):
    """Test resource usage threshold warnings."""
    response = client.get("/health/resources")
    assert response.status_code == 200
    data = response.json()
    
    # Memory thresholds
    assert "memory" in data
    assert "status" in data["memory"]
    assert "warning_threshold" in data["memory"]
    assert "critical_threshold" in data["memory"]
    
    # CPU thresholds
    assert "cpu" in data
    assert "status" in data["cpu"]
    assert "warning_threshold" in data["cpu"]
    assert "critical_threshold" in data["cpu"]
    
    # Disk thresholds
    assert "disk" in data
    assert "status" in data["disk"]
    assert "warning_threshold" in data["disk"]
    assert "critical_threshold" in data["disk"]

def test_performance_metrics(client: TestClient):
    """Test performance metrics endpoint."""
    response = client.get("/health/performance")
    assert response.status_code == 200
    data = response.json()
    
    # Response time metrics
    assert "response_times" in data
    assert "avg_response_time_ms" in data["response_times"]
    assert "p95_response_time_ms" in data["response_times"]
    assert "p99_response_time_ms" in data["response_times"]
    
    # Request rate metrics
    assert "request_rates" in data
    assert "requests_per_second" in data["request_rates"]
    assert "requests_per_minute" in data["request_rates"]
    
    # Error rate metrics
    assert "error_rates" in data
    assert "errors_per_second" in data["error_rates"]
    assert "error_percentage" in data["error_rates"]

def test_maintenance_mode(client: TestClient):
    """Test maintenance mode functionality."""
    # Enable maintenance mode
    response = client.post("/health/maintenance/enable")
    assert response.status_code == 200
    data = response.json()
    assert data["maintenance_mode"] == True
    assert "enabled_at" in data
    
    # Check health during maintenance
    response = client.get("/health")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "maintenance"
    
    # Disable maintenance mode
    response = client.post("/health/maintenance/disable")
    assert response.status_code == 200
    data = response.json()
    assert data["maintenance_mode"] == False
    assert "disabled_at" in data

def test_health_history(client: TestClient):
    """Test health check history endpoint."""
    response = client.get("/health/history")
    assert response.status_code == 200
    data = response.json()
    
    assert isinstance(data, list)
    if len(data) > 0:
        check = data[0]
        assert "timestamp" in check
        assert "status" in check
        assert "components" in check
        assert "database" in check["components"]
        assert "cache" in check["components"] 