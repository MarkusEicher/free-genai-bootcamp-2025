from typing import Any, Optional
from datetime import timedelta
import json
from fastapi import Request
from redis import Redis
from functools import wraps
from app.core.config import settings

def get_redis_client(test_mode: bool = False) -> Redis:
    """
    Get Redis client instance.
    
    Args:
        test_mode (bool): If True, use test database number
    
    Returns:
        Redis: Redis client instance
    """
    return Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_TEST_DB if test_mode else settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        decode_responses=True
    )

# Create default Redis client
redis_client = get_redis_client()

# Create test Redis client
test_redis_client = get_redis_client(test_mode=True)

class Cache:
    @staticmethod
    def key_builder(prefix: str, *args: Any, **kwargs: Any) -> str:
        """Build a cache key from prefix and arguments."""
        key_parts = [prefix]
        
        # Add positional args to key
        if args:
            key_parts.extend([str(arg) for arg in args])
        
        # Add keyword args to key
        if kwargs:
            key_parts.extend([f"{k}:{v}" for k, v in sorted(kwargs.items())])
        
        return ":".join(key_parts)

    @staticmethod
    def get(key: str, test_mode: bool = False) -> Optional[str]:
        """Get value from cache."""
        client = test_redis_client if test_mode else redis_client
        try:
            return client.get(key)
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    @staticmethod
    def set(key: str, value: Any, expire: int = 300, test_mode: bool = False) -> bool:
        """Set value in cache with expiration in seconds."""
        client = test_redis_client if test_mode else redis_client
        try:
            return client.setex(
                key,
                expire,
                json.dumps(value) if not isinstance(value, str) else value
            )
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

def cache_response(
    prefix: str,
    expire: int = 300,
    include_query_params: bool = False
):
    """
    Cache decorator for FastAPI endpoint responses.
    
    Args:
        prefix: Prefix for cache key
        expire: Cache expiration time in seconds
        include_query_params: Whether to include query parameters in cache key
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request object
            request = next((arg for arg in args if isinstance(arg, Request)), None)
            if not request:
                return await func(*args, **kwargs)

            # Determine if we're in test mode
            test_mode = settings.TEST_DATABASE_URL in str(request.app.state.db_engine.url)

            # Build cache key
            key_parts = [prefix, request.url.path]
            
            if include_query_params:
                query_params = str(request.query_params)
                if query_params:
                    key_parts.append(query_params)
            
            cache_key = Cache.key_builder(*key_parts)

            # Try to get from cache
            cached_response = Cache.get(cache_key, test_mode=test_mode)
            if cached_response:
                try:
                    return json.loads(cached_response)
                except json.JSONDecodeError:
                    return cached_response

            # Get fresh response
            response = await func(*args, **kwargs)
            
            # Cache the response
            Cache.set(cache_key, response, expire, test_mode=test_mode)
            
            return response
            
        return wrapper
    return decorator

# Cache invalidation functions
def invalidate_dashboard_cache(test_mode: bool = False):
    """Invalidate all dashboard-related caches."""
    client = test_redis_client if test_mode else redis_client
    try:
        keys = client.keys("dashboard:*")
        if keys:
            client.delete(*keys)
        return True
    except Exception as e:
        print(f"Cache invalidation error: {e}")
        return False

def invalidate_stats_cache(test_mode: bool = False):
    """Invalidate dashboard stats cache."""
    client = test_redis_client if test_mode else redis_client
    try:
        keys = client.keys("dashboard:stats:*")
        if keys:
            client.delete(*keys)
        return True
    except Exception as e:
        print(f"Stats cache invalidation error: {e}")
        return False