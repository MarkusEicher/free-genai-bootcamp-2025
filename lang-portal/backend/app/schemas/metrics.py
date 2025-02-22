"""Metrics schema models."""
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Union

class ResponseTimes(BaseModel):
    """Response time metrics."""
    avg: float = Field(..., description="Average response time in milliseconds")
    min: float = Field(..., description="Minimum response time in milliseconds")
    max: float = Field(..., description="Maximum response time in milliseconds")
    median: Optional[float] = Field(None, description="Median response time in milliseconds")

class CpuMetrics(BaseModel):
    """CPU metrics."""
    usage_percent: float = Field(..., description="CPU usage percentage")
    count: int = Field(..., description="Number of CPU cores")
    load_avg: tuple[float, float, float] = Field(..., description="System load averages for 1, 5, and 15 minutes")

class MemoryMetrics(BaseModel):
    """Memory metrics."""
    total: int = Field(..., description="Total physical memory in bytes")
    available: int = Field(..., description="Available memory in bytes")
    used: int = Field(..., description="Used memory in bytes")
    percent: float = Field(..., description="Memory usage percentage")

class DiskMetrics(BaseModel):
    """Disk metrics."""
    total: int = Field(..., description="Total disk space in bytes")
    used: int = Field(..., description="Used disk space in bytes")
    free: int = Field(..., description="Free disk space in bytes")
    percent: float = Field(..., description="Disk usage percentage")

class SystemMetricsResponse(BaseModel):
    """System metrics response."""
    cpu: CpuMetrics = Field(..., description="CPU metrics")
    memory: MemoryMetrics = Field(..., description="Memory metrics")
    disk: DiskMetrics = Field(..., description="Disk metrics")

class ApiRequestMetrics(BaseModel):
    """API request metrics."""
    total: int = Field(..., description="Total number of requests")
    rate_limited: int = Field(..., description="Number of rate-limited requests")
    successful: int = Field(..., description="Number of successful requests")

class ApiEndpointMetrics(BaseModel):
    """API endpoint metrics."""
    active: int = Field(..., description="Number of active endpoints")
    error_rates: Dict[str, int] = Field(..., description="Error rates by status code category")

class ApiPerformanceMetrics(BaseModel):
    """API performance metrics."""
    avg_response_time: float = Field(..., description="Average response time in milliseconds")
    peak_response_time: float = Field(..., description="Peak response time in milliseconds")

class ApiMetricsResponse(BaseModel):
    """API metrics response."""
    requests: ApiRequestMetrics = Field(..., description="Request metrics")
    endpoints: ApiEndpointMetrics = Field(..., description="Endpoint metrics")
    performance: ApiPerformanceMetrics = Field(..., description="Performance metrics")

class DatabaseTableMetrics(BaseModel):
    """Database table metrics."""
    activities: int = Field(..., description="Number of activities")
    vocabularies: int = Field(..., description="Number of vocabulary items")
    attempts: int = Field(..., description="Number of learning attempts")

class DatabaseSizeMetrics(BaseModel):
    """Database size metrics."""
    total_bytes: int = Field(..., description="Total database size in bytes")
    total_mb: float = Field(..., description="Total database size in megabytes")

class DatabasePerformanceMetrics(BaseModel):
    """Database performance metrics."""
    active_connections: int = Field(..., description="Number of active connections")
    cache_hit_ratio: float = Field(..., description="Database cache hit ratio")

class DatabaseMetricsResponse(BaseModel):
    """Database metrics response."""
    tables: DatabaseTableMetrics = Field(..., description="Table metrics")
    size: DatabaseSizeMetrics = Field(..., description="Size metrics")
    performance: DatabasePerformanceMetrics = Field(..., description="Performance metrics")

class CachePerformanceMetrics(BaseModel):
    """Cache performance metrics."""
    hit_ratio: float = Field(..., ge=0, le=1, description="Cache hit ratio")
    response_times: ResponseTimes = Field(..., description="Response time statistics")
    entry_count: int = Field(..., ge=0, description="Number of entries in cache")

class CachePrivacyMetrics(BaseModel):
    """Cache privacy metrics."""
    sanitization_rate: float = Field(..., ge=0, le=1, description="Data sanitization success rate")
    violations: int = Field(..., ge=0, description="Number of privacy violations")
    sanitizations: int = Field(..., ge=0, description="Number of successful sanitizations")

class CacheStorageMetrics(BaseModel):
    """Cache storage metrics."""
    total_size: int = Field(..., ge=0, description="Total cache size in bytes")
    utilization: float = Field(..., ge=0, le=1, description="Cache storage utilization")
    cleanup: Dict[str, Union[int, str, None]] = Field(..., description="Cache cleanup statistics")

class CacheMetricsResponse(BaseModel):
    """Cache metrics response."""
    performance: CachePerformanceMetrics = Field(..., description="Performance metrics")
    privacy: CachePrivacyMetrics = Field(..., description="Privacy metrics")
    storage: CacheStorageMetrics = Field(..., description="Storage metrics")

class FullMetricsResponse(BaseModel):
    """Complete system metrics response."""
    system: SystemMetricsResponse = Field(..., description="System metrics")
    api: ApiMetricsResponse = Field(..., description="API metrics")
    database: DatabaseMetricsResponse = Field(..., description="Database metrics")
    cache: CacheMetricsResponse = Field(..., description="Cache metrics")
    timestamp: str = Field(..., description="Timestamp of metrics collection")
    uptime: Optional[str] = Field(None, description="Application uptime")