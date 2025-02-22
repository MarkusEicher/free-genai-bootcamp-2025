"""System-wide metrics and monitoring endpoints."""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict
from datetime import datetime
import psutil
import logging
from app.core.cache import cache
from app.schemas.metrics import (
    CacheMetricsResponse,
    SystemMetricsResponse,
    ApiMetricsResponse,
    DatabaseMetricsResponse,
    FullMetricsResponse
)
from app.db.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/metrics/system",
    response_model=SystemMetricsResponse,
    summary="Get System Metrics",
    description="Get detailed system metrics including CPU, memory, and disk usage."
)
async def get_system_metrics() -> Dict:
    """Get system metrics with monitoring."""
    try:
        return {
            "cpu": {
                "usage_percent": psutil.cpu_percent(interval=1),
                "count": psutil.cpu_count(),
                "load_avg": psutil.getloadavg()
            },
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "used": psutil.virtual_memory().used,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "used": psutil.disk_usage('/').used,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            }
        }
    except Exception as e:
        logger.error(f"Error getting system metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve system metrics")

@router.get(
    "/metrics/api",
    response_model=ApiMetricsResponse,
    summary="Get API Metrics",
    description="Get detailed API usage metrics and performance statistics."
)
async def get_api_metrics(request: Request) -> Dict:
    """Get API metrics with monitoring."""
    try:
        # Get rate limiting stats from request state
        rate_limits = getattr(request.app.state, 'rate_limits', {})
        
        return {
            "requests": {
                "total": len(rate_limits),
                "rate_limited": sum(1 for v in rate_limits.values() if v.get('blocked', False)),
                "successful": sum(1 for v in rate_limits.values() if not v.get('blocked', False))
            },
            "endpoints": {
                "active": len(request.app.routes),
                "error_rates": {
                    "4xx": request.app.state.error_counts.get('4xx', 0),
                    "5xx": request.app.state.error_counts.get('5xx', 0)
                }
            },
            "performance": {
                "avg_response_time": request.app.state.avg_response_time,
                "peak_response_time": request.app.state.peak_response_time
            }
        }
    except Exception as e:
        logger.error(f"Error getting API metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve API metrics")

@router.get(
    "/metrics/database",
    response_model=DatabaseMetricsResponse,
    summary="Get Database Metrics",
    description="Get detailed database performance and usage metrics."
)
async def get_database_metrics(db: Session = Depends(get_db)) -> Dict:
    """Get database metrics with monitoring."""
    try:
        # Get database statistics
        stats_query = text("""
            SELECT 
                (SELECT COUNT(*) FROM activities) as activities_count,
                (SELECT COUNT(*) FROM vocabularies) as vocabularies_count,
                (SELECT COUNT(*) FROM session_attempts) as attempts_count,
                pg_database_size(current_database()) as db_size
        """)
        
        result = db.execute(stats_query).first()
        
        return {
            "tables": {
                "activities": result.activities_count,
                "vocabularies": result.vocabularies_count,
                "attempts": result.attempts_count
            },
            "size": {
                "total_bytes": result.db_size,
                "total_mb": round(result.db_size / (1024 * 1024), 2)
            },
            "performance": {
                "active_connections": db.execute(text("SELECT COUNT(*) FROM pg_stat_activity")).scalar(),
                "cache_hit_ratio": db.execute(text(
                    "SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) FROM pg_statio_user_tables"
                )).scalar()
            }
        }
    except Exception as e:
        logger.error(f"Error getting database metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve database metrics")

@router.get(
    "/metrics/cache",
    response_model=CacheMetricsResponse,
    summary="Get Cache Metrics",
    description="Get detailed metrics about the cache system performance, privacy, and storage."
)
async def get_cache_metrics() -> Dict:
    """Get cache metrics with monitoring."""
    try:
        return cache.metrics.to_dict()
    except Exception as e:
        logger.error(f"Error getting cache metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve cache metrics")

@router.get(
    "/metrics",
    response_model=FullMetricsResponse,
    summary="Get Full System Metrics",
    description="Get comprehensive metrics for the entire system."
)
async def get_full_metrics(
    request: Request,
    db: Session = Depends(get_db)
) -> Dict:
    """Get comprehensive system metrics."""
    try:
        return {
            "system": await get_system_metrics(),
            "api": await get_api_metrics(request),
            "database": await get_database_metrics(db),
            "cache": await get_cache_metrics(),
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": request.app.state.start_time.isoformat() if hasattr(request.app.state, 'start_time') else None
        }
    except Exception as e:
        logger.error(f"Error getting full metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve system metrics")