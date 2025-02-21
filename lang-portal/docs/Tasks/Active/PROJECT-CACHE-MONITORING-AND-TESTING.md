# Cache Monitoring and Testing Specification

## Overview
This document outlines the implementation of cache monitoring metrics and comprehensive testing for the Language Learning Portal's caching system.

## 1. Cache Monitoring Implementation

### Metrics to Track

#### Performance Metrics
- Cache hit ratio
- Average response time (cached vs. uncached)
- Cache size utilization
- Cache entry count
- Cache cleanup frequency

#### Privacy Metrics
- Sanitization success rate
- Privacy rule violations
- Sensitive data detection counts
- Cache access patterns

#### Storage Metrics
- Total cache size
- Size per cache category
- Cleanup efficiency
- Storage quota usage

### Implementation Details

```python
class CacheMetrics:
    def __init__(self):
        self.hit_count = 0
        self.miss_count = 0
        self.total_size = 0
        self.entry_count = 0
        self.cleanup_count = 0
        self.privacy_violations = 0
        self.sanitization_count = 0
        self.last_cleanup = None

    @property
    def hit_ratio(self) -> float:
        total = self.hit_count + self.miss_count
        return self.hit_count / total if total > 0 else 0.0

    @property
    def storage_utilization(self) -> float:
        return self.total_size / settings.MAX_CACHE_SIZE
```

### Monitoring Endpoints

```python
@router.get("/metrics/cache", response_model=CacheMetricsResponse)
async def get_cache_metrics():
    return {
        "performance": {
            "hit_ratio": cache.metrics.hit_ratio,
            "response_times": cache.metrics.get_response_times(),
            "entry_count": cache.metrics.entry_count
        },
        "privacy": {
            "sanitization_rate": cache.metrics.get_sanitization_rate(),
            "violations": cache.metrics.privacy_violations
        },
        "storage": {
            "total_size": cache.metrics.total_size,
            "utilization": cache.metrics.storage_utilization
        }
    }
```

## 2. Testing Implementation

### Unit Tests

#### Cache Operations
```python
def test_cache_basic_operations():
    # Test set/get operations
    cache.set("test_key", "test_value")
    assert cache.get("test_key") == "test_value"
    
    # Test expiration
    cache.set("expire_key", "expire_value", expire=1)
    time.sleep(2)
    assert cache.get("expire_key") is None

def test_cache_privacy():
    # Test data sanitization
    sensitive_data = {"email": "test@example.com", "name": "Test"}
    cache.set("sensitive", sensitive_data)
    cached = cache.get("sensitive")
    assert cached["email"] == "[REDACTED]"
    assert cached["name"] == "Test"
```

#### Performance Tests
```python
def test_cache_performance():
    # Test response times
    start = time.time()
    cache.get("perf_test")
    uncached_time = time.time() - start
    
    cache.set("perf_test", "value")
    start = time.time()
    cache.get("perf_test")
    cached_time = time.time() - start
    
    assert cached_time < uncached_time
```

### Integration Tests

#### API Integration
```python
async def test_cache_headers():
    response = await client.get("/api/v1/activities/1")
    assert "X-Cache-Status" in response.headers
    assert "Cache-Control" in response.headers
    
    # Test cache hit
    response2 = await client.get("/api/v1/activities/1")
    assert response2.headers["X-Cache-Status"] == "HIT"
```

#### Monitoring Integration
```python
async def test_metrics_endpoint():
    response = await client.get("/api/v1/metrics/cache")
    assert response.status_code == 200
    metrics = response.json()
    
    assert "performance" in metrics
    assert "privacy" in metrics
    assert "storage" in metrics
    
    assert 0 <= metrics["performance"]["hit_ratio"] <= 1
```

## 3. Implementation Tasks

### Backend Tasks
1. [x] Implement CacheMetrics class
2. [x] Add metrics collection to LocalCache
3. [x] Create metrics endpoints
4. [x] Add unit tests
5. [x] Add integration tests
6. [x] Update documentation

```	
ADMIN-EDIT 21-02-2025-14-10: 
The backend team has completed all tasks under the section ### Backend Tasks
```

### Frontend Tasks
1. [ ] Create cache monitoring dashboard
2. [ ] Implement real-time metrics updates
3. [ ] Add cache performance visualizations
4. [ ] Create cache management interface

## 4. Best Practices

### Monitoring
- Collect metrics without impacting performance
- Implement privacy-aware logging
- Use efficient data structures for metrics
- Implement rate limiting for metrics endpoints

### Testing
- Use isolated test environments
- Clean up test data after each test
- Mock external dependencies
- Test edge cases and error conditions

## 5. Privacy Considerations

### Data Collection
- No personal data in metrics
- Aggregate statistics only
- Privacy-preserving logging
- Secure metrics storage

### Access Control
- Metrics access restricted to admin
- No sensitive data in reports
- Sanitized error reporting
- Secure monitoring endpoints

## Timeline
1. Metrics Implementation: 2 days
2. Testing Implementation: 2 days
3. Frontend Integration: 2 days
4. Documentation & Review: 1 day

## Contact
For questions or clarifications, contact:
- Backend Team Lead
- Frontend Team Lead
- Project Manager 