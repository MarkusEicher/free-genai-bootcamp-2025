from typing import Any, Optional, Set
from datetime import datetime, timedelta
import json
import os
import threading
import hashlib
import re
from pathlib import Path
from app.core.config import settings
import shutil
import secrets
from fastapi import HTTPException

class LocalCache:
    """Local file-based cache implementation that respects privacy."""
    
    _cache_lock = threading.Lock()
    _instance = None
    
    def __init__(self):
        """Initialize the cache with privacy-focused settings."""
        self.cache_dir = Path(settings.CACHE_DIR)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        # Set restrictive permissions on cache directory
        os.chmod(self.cache_dir, 0o700)
        
        # Privacy settings
        self.max_cache_size = 50 * 1024 * 1024  # 50MB max cache size
        self.max_entry_size = 1 * 1024 * 1024   # 1MB max per entry
        self.cleanup_threshold = 0.9  # 90% full triggers cleanup
        
        # Sensitive patterns for sanitization
        self.sensitive_patterns = {
            "email", "password", "token", "secret",
            "api_key", "session", "auth", "key"
        }
    
    @classmethod
    def get_instance(cls) -> 'LocalCache':
        """Get singleton instance with thread safety."""
        if cls._instance is None:
            with cls._cache_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    def _get_cache_path(self, key: str) -> Path:
        """Get secure cache file path with sanitized key."""
        # Hash the key for privacy and security
        hashed_key = secrets.token_hex(16)
        return self.cache_dir / f"{hashed_key}.cache"
    
    def _sanitize_data(self, data: Any) -> Any:
        """Remove sensitive information from cached data."""
        if isinstance(data, dict):
            return {
                k: "[REDACTED]" if any(p in k.lower() for p in self.sensitive_patterns)
                else self._sanitize_data(v)
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        return data
    
    def _clean_expired_cache(self) -> None:
        """Securely clean expired cache files."""
        with self._cache_lock:
            current_time = datetime.now()
            total_size = 0
            
            # Track files to delete
            to_delete = []
            
            # Check all cache files
            for cache_file in self.cache_dir.glob("*.cache"):
                try:
                    with open(cache_file, 'r') as f:
                        cache_data = json.load(f)
                    
                    # Check expiration
                    expire_time = datetime.fromisoformat(cache_data.get('expire_time', ''))
                    if expire_time <= current_time:
                        to_delete.append(cache_file)
                    else:
                        total_size += cache_file.stat().st_size
                except (json.JSONDecodeError, KeyError, ValueError):
                    # Invalid cache file, mark for deletion
                    to_delete.append(cache_file)
            
            # Secure deletion of expired/invalid files
            for file_path in to_delete:
                self._secure_delete(file_path)
            
            # Check total cache size and clean if needed
            if total_size > self.max_cache_size * self.cleanup_threshold:
                self._reduce_cache_size()
    
    def _secure_delete(self, file_path: Path) -> None:
        """Securely delete a cache file."""
        try:
            # Overwrite with zeros
            with open(file_path, 'wb') as f:
                f.write(b'0' * file_path.stat().st_size)
            # Delete the file
            file_path.unlink()
        except (IOError, OSError) as e:
            print(f"Error securely deleting cache file: {e}")
    
    def _reduce_cache_size(self) -> None:
        """Reduce cache size by removing oldest entries."""
        cache_files = []
        for cache_file in self.cache_dir.glob("*.cache"):
            try:
                stats = cache_file.stat()
                cache_files.append((cache_file, stats.st_mtime))
            except OSError:
                continue
        
        # Sort by modification time (oldest first)
        cache_files.sort(key=lambda x: x[1])
        
        # Remove oldest files until under threshold
        total_size = sum(f.stat().st_size for f, _ in cache_files)
        target_size = self.max_cache_size * 0.7  # Reduce to 70%
        
        for file_path, _ in cache_files:
            if total_size <= target_size:
                break
            size = file_path.stat().st_size
            self._secure_delete(file_path)
            total_size -= size
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value with privacy checks."""
        cache_path = self._get_cache_path(key)
        
        with self._cache_lock:
            try:
                if not cache_path.exists():
                    return None
                
                with open(cache_path, 'r') as f:
                    cache_data = json.load(f)
                
                # Check expiration
                expire_time = datetime.fromisoformat(cache_data['expire_time'])
                if expire_time <= datetime.now():
                    self._secure_delete(cache_path)
                    return None
                
                return self._sanitize_data(cache_data['value'])
                
            except (json.JSONDecodeError, KeyError, ValueError, OSError):
                if cache_path.exists():
                    self._secure_delete(cache_path)
                return None
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set cache value with privacy protections."""
        if expire is None:
            expire = settings.CACHE_DEFAULT_EXPIRE
        
        cache_path = self._get_cache_path(key)
        cache_data = {
            'value': self._sanitize_data(value),
            'expire_time': (datetime.now() + timedelta(seconds=expire)).isoformat()
        }
        
        # Check cache entry size
        cache_size = len(json.dumps(cache_data))
        if cache_size > self.max_entry_size:
            raise HTTPException(
                status_code=413,
                detail="Cache entry too large"
            )
        
        with self._cache_lock:
            try:
                # Clean expired entries if needed
                self._clean_expired_cache()
                
                # Write with secure permissions
                with open(cache_path, 'w') as f:
                    json.dump(cache_data, f)
                os.chmod(cache_path, 0o600)
                
                return True
            except (IOError, OSError):
                return False
    
    def delete(self, key: str) -> bool:
        """Securely delete cache entry."""
        cache_path = self._get_cache_path(key)
        
        with self._cache_lock:
            if cache_path.exists():
                self._secure_delete(cache_path)
                return True
            return False
    
    def clear(self) -> bool:
        """Securely clear all cache entries."""
        with self._cache_lock:
            try:
                # Securely delete all cache files
                for cache_file in self.cache_dir.glob("*.cache"):
                    self._secure_delete(cache_file)
                
                # Recreate empty cache directory
                shutil.rmtree(self.cache_dir)
                self.cache_dir.mkdir(parents=True)
                os.chmod(self.cache_dir, 0o700)
                
                return True
            except (IOError, OSError):
                return False

    def _get_all_keys(self) -> Set[str]:
        """Get all cache keys (for testing/monitoring)."""
        keys = set()
        for cache_file in self.cache_dir.glob("*.cache"):
            try:
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                    if datetime.fromisoformat(data['expire_time']) > datetime.now():
                        keys.add(cache_file.stem)
            except (json.JSONDecodeError, KeyError, ValueError):
                continue
        return keys

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
                    and not any(re.search(pattern, str(v)) for pattern in cache.sensitive_patterns)
                }
                if safe_params:
                    key_parts.append(str(sorted(safe_params.items())))
            
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            cache_hit = cached_response is not None
            
            if cache_hit:
                response = cached_response
            else:
                try:
                    # Get fresh response
                    response = await func(*args, **kwargs)
                    # Cache the response
                    cache.set(cache_key, response, expire)
                except Exception as e:
                    # Don't cache errors
                    raise e
            
            # Add cache-related headers if we have a request object
            if args and hasattr(args[0], "headers"):
                request = args[0]
                headers = {
                    "X-Cache-Status": "HIT" if cache_hit else "MISS",
                    "Cache-Control": "no-store, no-cache",
                    "X-Cache-Expires": str(expire),
                }
                
                # Add headers to response
                if hasattr(response, "headers"):
                    response.headers.update(headers)
                else:
                    # Convert dict response to Response object
                    from fastapi.responses import JSONResponse
                    response = JSONResponse(
                        content=response,
                        headers=headers
                    )
            
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