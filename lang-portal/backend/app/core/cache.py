from typing import Any, Optional
from datetime import timedelta
import json
from fastapi import Request
from redis import Redis, ConnectionPool, ConnectionError
from functools import wraps
from app.core.config import settings

# Redis connection pools
_default_pool = None
_test_pool = None
_default_client = None
_test_client = None

def create_redis_pool(test_mode: bool = False) -> ConnectionPool:
    """Create a new Redis connection pool."""
    return ConnectionPool(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_TEST_DB if test_mode else settings.REDIS_DB,
        decode_responses=True,
        max_connections=10000,
        socket_timeout=5,
        socket_connect_timeout=5,
        retry_on_timeout=True
    )

def get_redis_client(test_mode: bool = False) -> Redis:
    """
    Get Redis client instance.
    
    Args:
        test_mode (bool): If True, use test database number
    
    Returns:
        Redis: Redis client instance
    
    Raises:
        ConnectionError: If Redis connection fails
    """
    global _default_pool, _test_pool, _default_client, _test_client
    
    try:
        if test_mode:
            if _test_client is not None:
                return _test_client
            
            if _test_pool is None:
                _test_pool = create_redis_pool(test_mode=True)
            _test_client = Redis(connection_pool=_test_pool)
            # Test connection
            try:
                _test_client.ping()
            except Exception as e:
                raise ConnectionError(f"Failed to connect to Redis: {str(e)}")
            return _test_client
        else:
            if _default_client is not None:
                return _default_client
            
            if _default_pool is None:
                _default_pool = create_redis_pool(test_mode=False)
            _default_client = Redis(connection_pool=_default_pool)
            # Test connection
            try:
                _default_client.ping()
            except Exception as e:
                raise ConnectionError(f"Failed to connect to Redis: {str(e)}")
            return _default_client
    except Exception as e:
        raise ConnectionError(f"Failed to connect to Redis: {str(e)}")

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
    def set(key: str, value: Any, expire: Optional[int] = None, test_mode: bool = False) -> bool:
        """Set value in cache with expiration in seconds."""
        client = test_redis_client if test_mode else redis_client
        try:
            if not isinstance(value, str):
                value = json.dumps(value)
            return bool(client.set(key, value, ex=expire if expire is not None else None))
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
            test_mode = settings.TEST_DATABASE_URL in str(getattr(request.app.state, 'db_engine', ''))

            # Build cache key
            key_parts = [prefix, request.url.path]
            
            # Include query params if specified
            if include_query_params and request.query_params:
                sorted_params = sorted(request.query_params.items())
                key_parts.append(str(sorted_params))
            
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
def invalidate_dashboard_cache(test_mode: bool = False) -> bool:
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

def invalidate_stats_cache(test_mode: bool = False) -> bool:
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