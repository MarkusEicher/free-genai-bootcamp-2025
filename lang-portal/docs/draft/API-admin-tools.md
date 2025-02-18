# Admin Tools Documentation

## Current Endpoints

### Test Management

#### GET `/api/v1/admin/test-summary`
Get a summary of test coverage and execution status.

Response:
```json
{
    "total_coverage": 85.2,
    "last_run": "2024-02-17T18:30:00Z",
    "test_count": 150,
    "status": "success"
}
```

#### POST `/api/v1/admin/run-tests`
Run tests in the background.

Parameters:
- `test_path` (optional): Specific test file to run

Response:
```json
{
    "status": "Tests started in background"
}
```

#### GET `/api/v1/admin/test-endpoints`
List all available test files and categories.

Response:
```json
{
    "test_files": [
        "tests/api/test_languages.py",
        "tests/core/test_cache.py"
    ],
    "categories": [
        "api", "core", "models", "middleware",
        "services", "db", "cache", "performance"
    ]
}
```

## Potential Additional Tools (No Extra Dependencies)

### Database Management

1. **SQLAlchemy Inspector**
```python
@router.get("/admin/db/tables")
async def list_tables():
    """List all database tables and their structure."""
    inspector = inspect(engine)
    return {
        table: {
            "columns": inspector.get_columns(table),
            "indexes": inspector.get_indexes(table),
            "foreign_keys": inspector.get_foreign_keys(table)
        }
        for table in inspector.get_table_names()
    }
```

2. **Alembic Management**
```python
@router.get("/admin/db/migrations")
async def list_migrations():
    """List migration history and status."""
    return {
        "current": alembic.current(),
        "history": alembic.history(),
        "pending": alembic.pending_migrations()
    }
```

3. **Query Statistics**
```python
@router.get("/admin/db/stats")
async def db_stats():
    """Get database statistics."""
    return {
        "table_sizes": ...,
        "row_counts": ...,
        "index_usage": ...
    }
```

### Redis Management

1. **Redis Info**
```python
@router.get("/admin/redis/info")
async def redis_info():
    """Get Redis server information."""
    return redis_client.info()
```

2. **Key Browser**
```python
@router.get("/admin/redis/keys")
async def list_keys(pattern: str = "*"):
    """Browse Redis keys."""
    return {
        "keys": redis_client.keys(pattern),
        "count": redis_client.dbsize()
    }
```

3. **Key Inspector**
```python
@router.get("/admin/redis/inspect/{key}")
async def inspect_key(key: str):
    """Inspect Redis key value and metadata."""
    return {
        "type": redis_client.type(key),
        "ttl": redis_client.ttl(key),
        "value": redis_client.get(key),
        "memory_usage": redis_client.memory_usage(key)
    }
```

### System Management

1. **Application Stats**
```python
@router.get("/admin/app/stats")
async def app_stats():
    """Get application statistics."""
    return {
        "uptime": ...,
        "request_count": ...,
        "error_rate": ...,
        "response_times": ...
    }
```

2. **Log Viewer**
```python
@router.get("/admin/logs")
async def view_logs(level: str = "ERROR"):
    """View application logs."""
    return {
        "logs": read_log_file(level),
        "levels": ["DEBUG", "INFO", "WARNING", "ERROR"]
    }
```

### Cache Management

1. **Cache Stats**
```python
@router.get("/admin/cache/stats")
async def cache_stats():
    """Get cache statistics."""
    return {
        "hit_rate": ...,
        "miss_rate": ...,
        "memory_usage": ...,
        "eviction_count": ...
    }
```

2. **Cache Inspector**
```python
@router.get("/admin/cache/inspect")
async def inspect_cache():
    """Inspect cache contents."""
    return {
        "keys": ...,
        "sizes": ...,
        "ttls": ...
    }
```

### Model Management

1. **Model Inspector**
```python
@router.get("/admin/models")
async def list_models():
    """List all models and their relationships."""
    return {
        model.__name__: {
            "fields": model.__table__.columns.keys(),
            "relationships": [r.key for r in model.__mapper__.relationships]
        }
        for model in Base.__subclasses__()
    }
```

2. **Data Browser**
```python
@router.get("/admin/data/{model}")
async def browse_data(model: str, limit: int = 10):
    """Browse model data."""
    Model = get_model_class(model)
    return {
        "data": db.query(Model).limit(limit).all(),
        "total": db.query(Model).count()
    }
```

## Integration Notes

1. All these tools can be implemented using existing dependencies:
   - FastAPI for endpoints
   - SQLAlchemy for database inspection
   - Redis client for cache management
   - Standard library for system stats

2. Security Considerations (to implement later):
   - Admin authentication
   - Role-based access
   - Action logging
   - Rate limiting

3. UI Integration:
   - All endpoints return JSON
   - Can be consumed by a frontend admin dashboard
   - Supports real-time updates via polling
   - Exportable data formats 