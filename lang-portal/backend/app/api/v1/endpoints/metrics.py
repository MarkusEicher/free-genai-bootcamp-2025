"""Cache metrics endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from app.core.cache import cache
from app.core.auth import get_current_admin_user
from app.schemas.metrics import CacheMetricsResponse

router = APIRouter()

@router.get(
    "/metrics/cache",
    response_model=CacheMetricsResponse,
    summary="Get Cache Metrics",
    description="""
    Get detailed metrics about the cache system performance, privacy, and storage.
    This endpoint is restricted to admin users only.
    """,
    responses={
        200: {
            "description": "Cache metrics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "performance": {
                            "hit_ratio": 0.85,
                            "response_times": {
                                "avg": 1.2,
                                "min": 0.5,
                                "max": 5.0
                            },
                            "entry_count": 150
                        },
                        "privacy": {
                            "sanitization_rate": 0.95,
                            "violations": 0
                        },
                        "storage": {
                            "total_size": 1048576,
                            "utilization": 0.45
                        }
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - Admin access required"
        }
    }
)
async def get_cache_metrics(
    current_user = Depends(get_current_admin_user)
) -> Dict:
    """Get cache metrics with privacy controls."""
    try:
        return cache.metrics.to_dict()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cache metrics: {str(e)}"
        ) 