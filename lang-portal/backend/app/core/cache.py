from typing import Any, Optional, Set
from datetime import datetime, timedelta
import json
import os
import threading
import hashlib
import re
from pathlib import Path
from app.core.config import settings

class LocalCache:
    """Local file-based cache implementation that respects privacy."""
    
    _cache_lock = threading.Lock()
    _instance = None
    
    def __init__(self):
        self._cache_dir = Path(settings.BACKEND_DIR) / "data" / "cache"
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._sensitive_patterns = {
            r"[0-9]{3,}",  # Numbers that could be IDs
            r"[a-fA-F0-9]{32,}",  # MD5/UUID-like strings
            r"eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*",  # JWT-like tokens
            r"[a-zA-Z0-9+/]{32,}={0,2}",  # Base64-like strings
            r"ip-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}",  # IP addresses
            r"(user|account|profile)-\d+",  # User identifiers
        }
        
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
        """Get cache file path for a key using secure hashing."""
        # Use SHA-256 for key hashing to prevent key enumeration
        hash_obj = hashlib.sha256(key.encode())
        return self._cache_dir / f"{hash_obj.hexdigest()}.cache"
    
    def _sanitize_data(self, data: Any) -> Any:
        """Sanitize data to remove any potentially sensitive information."""
        if isinstance(data, dict):
            return {k: self._sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        elif isinstance(data, str):
            # Check for sensitive patterns
            value = str(data)
            for pattern in self._sensitive_patterns:
                if re.search(pattern, value):
                    return "[REDACTED]"
            return value
        return data
    
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
                            
                # Secure deletion: overwrite with zeros before deletion
                if cache_file.exists():
                    with cache_file.open("wb") as f:
                        f.write(b"0" * os.path.getsize(cache_file))
                    cache_file.unlink()
            except (json.JSONDecodeError, KeyError, ValueError):
                if cache_file.exists():
                    cache_file.unlink()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache with privacy checks."""
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
                        # Secure deletion
                        with cache_file.open("wb") as f:
                            f.write(b"0" * os.path.getsize(cache_file))
                        cache_file.unlink()
                        return None
                
                # Sanitize data before returning
                return self._sanitize_data(data.get("value"))
        except (json.JSONDecodeError, KeyError, ValueError):
            return None
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set value in cache with privacy protection."""
        cache_file = self._get_cache_path(key)
        
        try:
            # Sanitize data before storing
            sanitized_value = self._sanitize_data(value)
            
            data = {
                "value": sanitized_value,
                "created_at": datetime.now().isoformat()
            }
            
            if expire is not None:
                data["expires_at"] = (datetime.now() + timedelta(seconds=expire)).isoformat()
            
            # Atomic write using temporary file
            temp_file = cache_file.with_suffix('.tmp')
            with temp_file.open("w") as f:
                json.dump(data, f)
            temp_file.replace(cache_file)
            
            return True
        except Exception:
            if temp_file.exists():
                temp_file.unlink()
            return False
    
    def delete(self, key: str) -> bool:
        """Securely delete a cache entry."""
        cache_file = self._get_cache_path(key)
        try:
            if cache_file.exists():
                # Secure deletion: overwrite with zeros
                with cache_file.open("wb") as f:
                    f.write(b"0" * os.path.getsize(cache_file))
                cache_file.unlink()
            return True
        except Exception:
            return False
    
    def clear(self) -> bool:
        """Securely clear all cache entries."""
        try:
            for cache_file in self._cache_dir.glob("*.cache"):
                # Secure deletion: overwrite with zeros
                with cache_file.open("wb") as f:
                    f.write(b"0" * os.path.getsize(cache_file))
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
                # Remove any potential user identifiers from path
                clean_path = re.sub(r"/(?:user|profile|account)/\d+", "/[REDACTED]", args[0].url.path)
                key_parts.append(clean_path)
            
            # Include non-identifying query params if specified
            if include_query_params and args and hasattr(args[0], "query_params"):
                # Strict whitelist of allowed parameters
                safe_params = {
                    k: v for k, v in args[0].query_params.items()
                    if k in {"limit", "offset", "sort", "order", "filter"}
                    and not any(re.search(pattern, str(v)) for pattern in cache._sensitive_patterns)
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
            # Secure deletion
            with cache_file.open("wb") as f:
                f.write(b"0" * os.path.getsize(cache_file))
            cache_file.unlink()
        return True
    except Exception:
        return False

def invalidate_stats_cache() -> bool:
    """Invalidate dashboard stats cache."""
    try:
        for cache_file in (Path(settings.BACKEND_DIR) / "data" / "cache").glob("dashboard:stats:*.cache"):
            # Secure deletion
            with cache_file.open("wb") as f:
                f.write(b"0" * os.path.getsize(cache_file))
            cache_file.unlink()
        return True
    except Exception:
        return False