# Admin Endpoints Documentation

The admin endpoints provide a way to monitor, test, and manage the backend system. These endpoints are particularly useful for development, testing, and system administration.

## Base URL
All admin endpoints are prefixed with `/api/v1/admin/`

## Authentication
**Important**: These endpoints should be properly secured in production environments.

## Endpoints

### Test Management

#### GET `/test-summary`
Get a summary of all tests and coverage.

Response:
```json
{
    "total_coverage": 85.4,
    "last_run": "2024-02-17T15:30:00Z",
    "test_count": 150
}
```

#### POST `/run-tests`
Run tests in the background.

Parameters:
- `test_path` (optional): Specific test file or directory to run

Response:
```json
{
    "status": "Tests started in background"
}
```

### System Monitoring

#### GET `/system-status`
Get system resource usage information.

Response:
```json
{
    "cpu_percent": 45.2,
    "memory_usage": {
        "total": 16000000000,
        "available": 8000000000,
        "percent": 50.0
    },
    "disk_usage": {
        "total": 500000000000,
        "free": 250000000000,
        "percent": 50.0
    }
}
```

#### GET `/database-info`
Get database statistics and information.

Response:
```json
{
    "table_statistics": {
        "languages": 10,
        "vocabularies": 500,
        "progress": 1000
    },
    "database_size": 1048576
}
```

### Cache Management

#### GET `/cache-info`
Get Redis cache information.

Response:
```json
{
    "used_memory": 1048576,
    "connected_clients": 5,
    "total_keys": 1000,
    "last_save": "2024-02-17T15:30:00Z"
}
```

#### POST `/clear-cache`
Clear all cache data.

Response:
```json
{
    "status": "Cache cleared successfully"
}
```

### Test Discovery

#### GET `/test-endpoints`
List all available test endpoints.

Response:
```json
{
    "test_files": [
        "tests/api/test_languages.py",
        "tests/core/test_cache.py"
    ],
    "categories": [
        "api",
        "core",
        "models",
        "middleware",
        "services",
        "db",
        "cache",
        "performance"
    ]
}
```

### Performance Monitoring

#### GET `/performance-metrics`
Get detailed performance metrics.

Response:
```json
{
    "response_times": {
        "avg_response_time_ms": 150,
        "p95_response_time_ms": 200,
        "p99_response_time_ms": 300
    },
    "request_rates": {
        "requests_per_second": 10,
        "requests_per_minute": 600
    },
    "error_rates": {
        "errors_per_second": 0.1,
        "error_percentage": 1.0
    }
}
```

## Using the Admin Interface

### For Development
1. Monitor test coverage during development
2. Run specific test suites
3. Check system resource usage
4. Manage cache data

### For Testing
1. Run integration tests
2. Verify system performance
3. Check database state
4. Monitor resource usage

### For Production
1. Monitor system health
2. Track performance metrics
3. Manage cache
4. View test results

## Best Practices

1. **Security**
   - Restrict access to admin endpoints
   - Use proper authentication
   - Monitor usage

2. **Performance**
   - Run tests in background
   - Cache heavy operations
   - Monitor resource usage

3. **Monitoring**
   - Regular health checks
   - Performance tracking
   - Resource monitoring

## Frontend Integration

The admin endpoints can be used to create a comprehensive admin dashboard:

1. **Test Management Panel**
   - Test runner
   - Coverage viewer
   - Test results display

2. **System Monitor**
   - Resource usage graphs
   - Performance metrics
   - Alert system

3. **Database Manager**
   - Table statistics
   - Data viewer
   - Cache manager

4. **Performance Dashboard**
   - Response time graphs
   - Request rate tracking
   - Error monitoring

## Error Handling

All endpoints follow standard error response format:

```json
{
    "detail": "Error message",
    "code": "ERROR_CODE",
    "timestamp": "2024-02-17T15:30:00Z"
}
```

Common error codes:
- `TEST_RUNNING`: Tests already running
- `CACHE_ERROR`: Cache operation failed
- `DB_ERROR`: Database error
- `SYSTEM_ERROR`: System-level error

## Rate Limiting

To prevent abuse, endpoints are rate-limited:
- 60 requests per minute for GET endpoints
- 10 requests per minute for POST endpoints
- 5 requests per minute for test runs

## Webhook Support

Endpoints can trigger webhooks for:
- Test completion
- System alerts
- Performance thresholds
- Error conditions

Configure webhooks in `.env`:
```
WEBHOOK_URL=https://your-webhook-url
WEBHOOK_SECRET=your-secret
``` 