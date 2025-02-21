"""Cache metrics collection and monitoring."""
from datetime import datetime
from typing import Dict, List
import threading
import statistics
from app.core.config import settings

class CacheMetrics:
    """Collects and manages cache performance metrics."""
    
    def __init__(self):
        self._lock = threading.Lock()
        # Performance metrics
        self.hit_count: int = 0
        self.miss_count: int = 0
        self.total_size: int = 0
        self.entry_count: int = 0
        
        # Privacy metrics
        self.privacy_violations: int = 0
        self.sanitization_count: int = 0
        
        # Cleanup metrics
        self.cleanup_count: int = 0
        self.last_cleanup: datetime | None = None
        self.cleaned_entries: int = 0
        self.cleaned_size: int = 0
        
        # Response time tracking
        self._response_times: List[float] = []
        self._max_response_times: int = 1000  # Keep last 1000 times
    
    def record_hit(self, response_time_ms: float) -> None:
        """Record a cache hit with response time."""
        with self._lock:
            self.hit_count += 1
            self._record_response_time(response_time_ms)
    
    def record_miss(self, response_time_ms: float) -> None:
        """Record a cache miss with response time."""
        with self._lock:
            self.miss_count += 1
            self._record_response_time(response_time_ms)
    
    def record_cleanup(self, cleaned_entries: int, cleaned_size: int) -> None:
        """Record cache cleanup operation."""
        with self._lock:
            self.cleanup_count += 1
            self.cleaned_entries += cleaned_entries
            self.cleaned_size += cleaned_size
            self.last_cleanup = datetime.utcnow()
            self.entry_count = max(0, self.entry_count - cleaned_entries)
            self.total_size = max(0, self.total_size - cleaned_size)
    
    def record_privacy_violation(self) -> None:
        """Record a privacy rule violation."""
        with self._lock:
            self.privacy_violations += 1
    
    def record_sanitization(self) -> None:
        """Record successful data sanitization."""
        with self._lock:
            self.sanitization_count += 1
    
    def _record_response_time(self, response_time_ms: float) -> None:
        """Record response time with rolling window."""
        self._response_times.append(response_time_ms)
        if len(self._response_times) > self._max_response_times:
            self._response_times.pop(0)
    
    @property
    def hit_ratio(self) -> float:
        """Calculate cache hit ratio."""
        total = self.hit_count + self.miss_count
        return self.hit_count / total if total > 0 else 0.0
    
    @property
    def storage_utilization(self) -> float:
        """Calculate storage utilization ratio."""
        return self.total_size / settings.MAX_CACHE_SIZE if settings.MAX_CACHE_SIZE > 0 else 0.0
    
    def get_response_times(self) -> Dict[str, float]:
        """Get response time statistics."""
        if not self._response_times:
            return {"avg": 0.0, "min": 0.0, "max": 0.0, "median": 0.0}
        
        return {
            "avg": statistics.mean(self._response_times),
            "min": min(self._response_times),
            "max": max(self._response_times),
            "median": statistics.median(self._response_times)
        }
    
    def get_sanitization_rate(self) -> float:
        """Calculate data sanitization success rate."""
        total = self.sanitization_count + self.privacy_violations
        return self.sanitization_count / total if total > 0 else 0.0
    
    def get_cleanup_stats(self) -> Dict[str, any]:
        """Get cache cleanup statistics."""
        return {
            "count": self.cleanup_count,
            "last_cleanup": self.last_cleanup.isoformat() if self.last_cleanup else None,
            "total_entries_cleaned": self.cleaned_entries,
            "total_size_cleaned": self.cleaned_size
        }
    
    def to_dict(self) -> Dict:
        """Convert all metrics to dictionary format."""
        return {
            "performance": {
                "hit_ratio": self.hit_ratio,
                "response_times": self.get_response_times(),
                "entry_count": self.entry_count
            },
            "privacy": {
                "sanitization_rate": self.get_sanitization_rate(),
                "violations": self.privacy_violations,
                "sanitizations": self.sanitization_count
            },
            "storage": {
                "total_size": self.total_size,
                "utilization": self.storage_utilization,
                "cleanup": self.get_cleanup_stats()
            }
        } 