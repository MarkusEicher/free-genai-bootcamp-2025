from typing import Any, Optional
from datetime import datetime, timedelta
import json
import os
import threading
from pathlib import Path
from app.core.config import settings

class LocalCache:
    """Local file-based cache implementation that respects privacy."""
    
    _cache_lock = threading.Lock()
    _instance = None
    
    def __init__(self):
        self._cache_dir = Path(settings.BACKEND_DIR) / "data" / "cache"
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Clean expired cache files on startup
        self._clean_expired_cache()
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._cache_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    def _get_cache_path(self, key: str) -> Path:
        """Get cache file path for a key."""
        # Use hash of key as filename to avoid filesystem issues
        return self._cache_dir / f"{hash(key)}.cache"
    
    def _clean_expired_cache(self):
        """Remove expired cache files."""
        now = datetime.now()
        for cache_file in self._cache_dir.glob("*.cache"):
            try:
                with cache_file.open("r") as f:
                    data = json.load(f)
                    if data.get("expires_at"):
                        expires_at = datetime.fromisoformat(data["expires_at"])
                        if expires_at <= now:
                            cache_file.unlink()
            except (json.JSONDecodeError, KeyError, ValueError):
                # Remove invalid cache files
                cache_file.unlink()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        cache_file = self._get_cache_path(key)
        if not cache_file.exists():
            return None
            
        try:
            with cache_file.open("r") as f:
                data = json.load(f)
                
                # Check expiration
                if data.get("expires_at"):
                    expires_at = datetime.fromisoformat(data["expires_at"])
                    if expires_at <= datetime.now():
                        cache_file.unlink()
                        return None
                
                return data.get("value")
        except (json.JSONDecodeError, KeyError, ValueError):
            return None
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set value in cache with optional expiration in seconds."""
        cache_file = self._get_cache_path(key)
        
        try:
            data = {
                "value": value,
                "created_at": datetime.now().isoformat()
            }
            
            if expire is not None:
                data["expires_at"] = (datetime.now() + timedelta(seconds=expire)).isoformat()
            
            with cache_file.open("w") as f:
                json.dump(data, f)
            return True
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete a cache entry."""
        cache_file = self._get_cache_path(key)
        try:
            if cache_file.exists():
                cache_file.unlink()
            return True
        except Exception:
            return False
    
    def clear(self) -> bool:
        """Clear all cache entries."""
        try:
            for cache_file in self._cache_dir.glob("*.cache"):
                cache_file.unlink()
            return True
        except Exception:
            return False

# Create singleton instance
cache = LocalCache.get_instance()

def cache_response(
    prefix: str,
    expire: Optional[int] = 300,
    include_query_params: bool = False
):
    """
    Cache decorator for FastAPI endpoint responses.
    Implements privacy-first caching with minimal data collection.
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Build cache key
            key_parts = [prefix]
            
            # Add path without any identifying information
            if args and hasattr(args[0], "url"):
                key_parts.append(args[0].url.path)
            
            # Include non-identifying query params if specified
            if include_query_params and args and hasattr(args[0], "query_params"):
                # Filter out potentially identifying parameters
                safe_params = {
                    k: v for k, v in args[0].query_params.items()
                    if k in {"limit", "offset", "sort", "order"}
                }
                if safe_params:
                    key_parts.append(str(sorted(safe_params.items())))
            
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                return cached_response
            
            # Get fresh response
            response = await func(*args, **kwargs)
            
            # Cache the response
            cache.set(cache_key, response, expire)
            
            return response
        
        return wrapper
    return decorator

# Cache invalidation functions
def invalidate_dashboard_cache() -> bool:
    """Invalidate all dashboard-related caches."""
    try:
        for cache_file in (Path(settings.BACKEND_DIR) / "data" / "cache").glob("dashboard:*.cache"):
            cache_file.unlink()
        return True
    except Exception:
        return False

def invalidate_stats_cache() -> bool:
    """Invalidate dashboard stats cache."""
    try:
        for cache_file in (Path(settings.BACKEND_DIR) / "data" / "cache").glob("dashboard:stats:*.cache"):
            cache_file.unlink()
        return True
    except Exception:
        return False