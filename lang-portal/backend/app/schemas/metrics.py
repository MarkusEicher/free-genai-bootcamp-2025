"""Metrics schema models."""
from pydantic import BaseModel, Field
from typing import Dict

class ResponseTimes(BaseModel):
    """Response time metrics."""
    avg: float = Field(..., description="Average response time in milliseconds")
    min: float = Field(..., description="Minimum response time in milliseconds")
    max: float = Field(..., description="Maximum response time in milliseconds")

class PerformanceMetrics(BaseModel):
    """Cache performance metrics."""
    hit_ratio: float = Field(
        ...,
        description="Ratio of cache hits to total requests",
        ge=0,
        le=1
    )
    response_times: ResponseTimes = Field(
        ...,
        description="Response time statistics"
    )
    entry_count: int = Field(
        ...,
        description="Number of entries in cache",
        ge=0
    )

class PrivacyMetrics(BaseModel):
    """Cache privacy metrics."""
    sanitization_rate: float = Field(
        ...,
        description="Ratio of sanitized responses to total responses",
        ge=0,
        le=1
    )
    violations: int = Field(
        ...,
        description="Number of privacy violations detected",
        ge=0
    )

class StorageMetrics(BaseModel):
    """Cache storage metrics."""
    total_size: int = Field(
        ...,
        description="Total size of cache in bytes",
        ge=0
    )
    utilization: float = Field(
        ...,
        description="Cache storage utilization ratio",
        ge=0,
        le=1
    )

class CacheMetricsResponse(BaseModel):
    """Complete cache metrics response."""
    performance: PerformanceMetrics = Field(
        ...,
        description="Performance-related metrics"
    )
    privacy: PrivacyMetrics = Field(
        ...,
        description="Privacy-related metrics"
    )
    storage: StorageMetrics = Field(
        ...,
        description="Storage-related metrics"
    ) 