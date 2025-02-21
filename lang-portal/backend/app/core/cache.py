from typing import Any, Optional, Set, Dict
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
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import time

class CacheMetrics:
    """Metrics collection for cache monitoring."""
    
    def __init__(self):
        self._lock = threading.Lock()
        self.hit_count = 0
        self.miss_count = 0
        self.total_size = 0
        self.entry_count = 0
        self.cleanup_count = 0
        self.privacy_violations = 0
        self.sanitization_count = 0
        self.last_cleanup = None
        self._response_times = []
        self._max_response_times = 1000  # Keep last 1000 response times

    def record_hit(self, response_time_ms: float):
        with self._lock:
            self.hit_count += 1
            self._record_response_time(response_time_ms)

    def record_miss(self, response_time_ms: float):
        with self._lock:
            self.miss_count += 1
            self._record_response_time(response_time_ms)

    def record_cleanup(self, cleaned_entries: int, cleaned_size: int):
        with self._lock:
            self.cleanup_count += 1
            self.entry_count -= cleaned_entries
            self.total_size -= cleaned_size
            self.last_cleanup = datetime.utcnow()

    def record_privacy_violation(self):
        with self._lock:
            self.privacy_violations += 1

    def record_sanitization(self):
        with self._lock:
            self.sanitization_count += 1

    def _record_response_time(self, response_time_ms: float):
        self._response_times.append(response_time_ms)
        if len(self._response_times) > self._max_response_times:
            self._response_times.pop(0)

    @property
    def hit_ratio(self) -> float:
        total = self.hit_count + self.miss_count
        return self.hit_count / total if total > 0 else 0.0

    @property
    def storage_utilization(self) -> float:
        return self.total_size / settings.MAX_CACHE_SIZE

    def get_response_times(self) -> Dict[str, float]:
        if not self._response_times:
            return {"avg": 0, "min": 0, "max": 0}
        return {
            "avg": sum(self._response_times) / len(self._response_times),
            "min": min(self._response_times),
            "max": max(self._response_times)
        }

    def get_sanitization_rate(self) -> float:
        return (self.sanitization_count / 
                (self.hit_count + self.miss_count) if 
                (self.hit_count + self.miss_count) > 0 else 0.0)

    def to_dict(self) -> Dict:
        return {
            "performance": {
                "hit_ratio": self.hit_ratio,
                "response_times": self.get_response_times(),
                "entry_count": self.entry_count
            },
            "privacy": {
                "sanitization_rate": self.get_sanitization_rate(),
                "violations": self.privacy_violations
            },
            "storage": {
                "total_size": self.total_size,
                "utilization": self.storage_utilization
            }
        }

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
        
        # Enhanced sensitive patterns for activity data
        self.sensitive_patterns = {
            "email", "password", "token", "secret",
            "api_key", "session", "auth", "key",
            "user_id", "ip_address", "device_info",
            "location", "timestamp", "metadata"
        }
        
        # Activity-specific settings
        self.activity_cache_prefix = "activity:"
        self.activity_cache_expire = 300  # 5 minutes default
        self.max_activity_cache_size = 10 * 1024 * 1024  # 10MB for activities
        
        self.hit_count = 0
        self.miss_count = 0
        self.metrics = CacheMetrics()
    
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
        """Enhanced sanitization with activity-specific rules."""
        if isinstance(data, dict):
            # Special handling for activity data
            if "type" in data and "privacy_level" in data:
                # This is an activity object
                sanitized = {
                    k: (
                        "[REDACTED]" if any(p in k.lower() for p in self.sensitive_patterns)
                        else (
                            self._sanitize_activity_field(k, v)
                            if k in {"description", "local_storage_path", "metadata"}
                            else self._sanitize_data(v)
                        )
                    )
                    for k, v in data.items()
                }
                return sanitized
            
            return {
                k: "[REDACTED]" if any(p in k.lower() for p in self.sensitive_patterns)
                else self._sanitize_data(v)
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        return data
    
    def _sanitize_activity_field(self, field: str, value: Any) -> Any:
        """Sanitize specific activity fields."""
        if field == "description":
            # Remove any potential sensitive information from descriptions
            return re.sub(r"(https?://\S+)|(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)", "[REDACTED]", str(value))
        elif field == "local_storage_path":
            # Only return the filename, not the full path
            return Path(str(value)).name if value else None
        elif field == "metadata":
            # Remove all metadata except safe fields
            safe_metadata_fields = {"created_at", "updated_at", "type", "format"}
            return {k: v for k, v in value.items() if k in safe_metadata_fields} if isinstance(value, dict) else None
        return value
    
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
        """Get cached value with privacy checks and monitoring."""
        start_time = datetime.utcnow()
        try:
            cache_path = self._get_cache_path(key)
            if not cache_path.exists():
                response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
                self.metrics.record_miss(response_time)
                return None
                
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
            
            # Check expiration
            expire_time = datetime.fromisoformat(cache_data['expire_time'])
            if expire_time <= datetime.now():
                self._secure_delete(cache_path)
                response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
                self.metrics.record_miss(response_time)
                return None
            
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            self.metrics.record_hit(response_time)
            return self._sanitize_data(cache_data['value'])
                
        except (json.JSONDecodeError, KeyError, ValueError, OSError):
            if cache_path.exists():
                self._secure_delete(cache_path)
            response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            self.metrics.record_miss(response_time)
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
                
                self.metrics.entry_count += 1
                self.metrics.total_size += cache_path.stat().st_size
                return True
            except (IOError, OSError):
                self.metrics.record_privacy_violation()
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

    def cache_activity(self, activity_id: int, data: Dict, expire: Optional[int] = None) -> bool:
        """Cache activity data with enhanced privacy controls."""
        key = f"{self.activity_cache_prefix}{activity_id}"
        
        # Additional privacy checks for activity data
        if not self._is_safe_activity_data(data):
            return False
        
        # Set activity-specific expiration
        if expire is None:
            expire = self.activity_cache_expire
        
        return self.set(key, data, expire)
    
    def get_activity(self, activity_id: int) -> Optional[Dict]:
        """Get cached activity data with privacy checks."""
        key = f"{self.activity_cache_prefix}{activity_id}"
        return self.get(key)
    
    def invalidate_activity(self, activity_id: int) -> bool:
        """Invalidate cached activity data."""
        key = f"{self.activity_cache_prefix}{activity_id}"
        return self.delete(key)
    
    def _is_safe_activity_data(self, data: Dict) -> bool:
        """Check if activity data meets privacy requirements."""
        if not isinstance(data, dict):
            return False
            
        # Check for required fields
        required_fields = {"id", "type", "name"}
        if not all(field in data for field in required_fields):
            return False
            
        # Check data size
        if len(json.dumps(data)) > self.max_activity_cache_size:
            return False
            
        # Validate privacy level
        privacy_level = data.get("privacy_level", "private")
        if privacy_level not in {"private", "shared", "public"}:
            return False
            
        return True

# Create singleton instance
cache = LocalCache.get_instance()

def cache_response(
    prefix: str,
    expire: Optional[int] = 300,
    include_query_params: bool = False,
    monitor: bool = True
):
    """
    Cache decorator for FastAPI endpoint responses.
    Implements privacy-first caching with frontend integration support.
    
    Args:
        prefix: Cache key prefix
        expire: Cache expiration time in seconds
        include_query_params: Whether to include safe query params in cache key
        monitor: Whether to collect cache statistics
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_instance = LocalCache.get_instance()
            request = next((arg for arg in args if isinstance(arg, Request)), None)
            
            # Build cache key
            key_parts = [prefix]
            
            if request:
                # Clean path and add to key parts
                clean_path = re.sub(r"/(?:user|profile|account)/\d+", "/[REDACTED]", request.url.path)
                key_parts.append(clean_path)
                
                # Include safe query params if specified
                if include_query_params:
                    safe_params = {
                        k: v for k, v in request.query_params.items()
                        if k in {"limit", "offset", "sort", "order", "filter", "lang", "level"}
                        and not any(re.search(pattern, str(v)) for pattern in cache_instance.sensitive_patterns)
                    }
                    if safe_params:
                        key_parts.append(str(sorted(safe_params.items())))
            
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_response = cache_instance.get(cache_key)
            cache_hit = cached_response is not None
            
            # Get response
            if cache_hit:
                response = cached_response
            else:
                try:
                    response = await func(*args, **kwargs)
                    # Don't cache error responses
                    if not isinstance(response, HTTPException):
                        cache_instance.set(cache_key, response, expire)
                except Exception as e:
                    raise e
            
            # Prepare cache headers
            cache_headers = {
                "X-Cache-Status": "HIT" if cache_hit else "MISS",
                "Cache-Control": f"private, max-age={expire}",
                "X-Cache-Expires": str(int(time.time()) + expire),
                "X-Cache-Key": cache_key
            }
            
            # Add monitoring headers if enabled
            if monitor:
                cache_stats = {
                    "total_size": sum(f.stat().st_size for f in cache_instance.cache_dir.glob("*.cache")),
                    "entry_count": len(list(cache_instance.cache_dir.glob("*.cache"))),
                    "hit_ratio": len(cache_instance._get_all_keys()) / (cache_instance.hit_count + cache_instance.miss_count) if (cache_instance.hit_count + cache_instance.miss_count) > 0 else 0
                }
                cache_headers["X-Cache-Stats"] = json.dumps(cache_stats)
            
            # Return response with headers
            if isinstance(response, (dict, list)):
                return JSONResponse(
                    content=response,
                    headers=cache_headers
                )
            elif hasattr(response, "headers"):
                response.headers.update(cache_headers)
                return response
            else:
                return JSONResponse(
                    content={"data": response},
                    headers=cache_headers
                )
        
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