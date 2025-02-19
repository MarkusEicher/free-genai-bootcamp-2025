# Performance Tests

This directory contains performance tests that verify system performance while maintaining privacy and local-only principles.

## Test Categories

### 1. Response Time (`test_response_time.py`)
- API endpoint latency
- Cache performance
- Database query speed
- File system operations

### 2. Resource Usage (`test_resources.py`)
- Memory consumption
- CPU utilization
- File system usage
- Cache size management

### 3. Concurrency (`test_concurrency.py`)
- Parallel request handling
- Database connection pool
- Cache access patterns
- Resource contention

## Privacy-First Performance Testing

### 1. Local-Only Metrics
- No external monitoring
- No telemetry
- Privacy-preserving measurements
- Local resource tracking

### 2. Data Collection
- Minimal data retention
- Aggregated metrics only
- No personal information
- Temporary storage

## Running Tests

```bash
# Run all performance tests
pytest tests/performance/

# Run with performance markers
pytest -m performance

# Run specific test category
pytest tests/performance/test_response_time.py
```

## Test Configuration

### 1. Environment Setup
```python
@pytest.fixture(scope="session")
def perf_config():
    return {
        "requests": 1000,
        "concurrent_users": 10,
        "duration_seconds": 60,
        "max_memory_mb": 512,
        "max_response_time_ms": 500
    }
```

### 2. Measurement Tools
```python
class PerformanceMetrics:
    def __init__(self):
        self.start_time = time.time()
        self.measurements = []
    
    def record(self, metric_name, value):
        self.measurements.append({
            "metric": metric_name,
            "value": value,
            "timestamp": time.time()
        })
```

## Test Categories

### 1. Response Time Tests
```python
def test_api_response_time(client, perf_config):
    """Test API endpoint response times."""
    metrics = PerformanceMetrics()
    
    for _ in range(perf_config["requests"]):
        start = time.time()
        response = client.get("/api/v1/health")
        duration = (time.time() - start) * 1000
        
        metrics.record("response_time", duration)
        assert duration < perf_config["max_response_time_ms"]
```

### 2. Resource Usage Tests
```python
def test_memory_usage(client, perf_config):
    """Test memory usage during operations."""
    process = psutil.Process()
    initial_memory = process.memory_info().rss / 1024 / 1024
    
    # Perform operations
    for _ in range(perf_config["requests"]):
        client.get("/api/v1/dashboard/stats")
    
    final_memory = process.memory_info().rss / 1024 / 1024
    memory_increase = final_memory - initial_memory
    
    assert memory_increase < perf_config["max_memory_mb"]
```

## Performance Targets

### 1. Response Times
- API endpoints: < 500ms
- Cache hits: < 50ms
- Database queries: < 200ms
- File operations: < 100ms

### 2. Resource Limits
- Memory: < 512MB
- CPU: < 50%
- Disk space: < 1GB
- Cache size: < 100MB

### 3. Concurrency
- Concurrent users: 50
- Request rate: 100/sec
- Connection pool: 20
- Worker processes: 4

## Best Practices

### 1. Test Isolation
- Clean environment before tests
- Independent test cases
- Resource cleanup
- Cache clearing

### 2. Measurement Accuracy
- Warm-up periods
- Multiple iterations
- Statistical analysis
- Outlier detection

### 3. Resource Management
- Proper cleanup
- Memory monitoring
- Connection pooling
- Cache size limits

## Common Issues

### 1. Performance Degradation
- Memory leaks
- Cache invalidation
- Database connections
- File handle exhaustion

### 2. Resource Contention
- Database locks
- File system bottlenecks
- Cache conflicts
- CPU saturation

### 3. Measurement Errors
- System load interference
- Network latency
- Disk I/O variation
- Process scheduling

## Debugging

### 1. Performance Logs
```bash
pytest tests/performance/ --log-cli-level=DEBUG
```

### 2. Resource Monitoring
```bash
# Memory usage
watch -n 1 'ps -o pid,ppid,cmd,%mem,%cpu --sort=-%mem | head'

# Disk I/O
iostat -x 1
```

### 3. Profiling
```python
@pytest.mark.profiling
def test_with_profiling():
    profiler = cProfile.Profile()
    profiler.enable()
    # Test code
    profiler.disable()
    stats = pstats.Stats(profiler).sort_stats('cumulative')
    stats.print_stats()
```

## Adding New Tests

1. Choose appropriate category
2. Define performance metrics
3. Set acceptance criteria
4. Implement measurements
5. Document thresholds

## Privacy Considerations

1. Data Collection
   - No personal information
   - Aggregate metrics only
   - Temporary storage
   - Local analysis

2. Resource Isolation
   - Separate test environment
   - Isolated storage
   - Clean test data
   - Limited retention

3. Reporting
   - Anonymous metrics
   - Aggregated results
   - No individual traces
   - Local storage only 