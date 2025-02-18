# Backend Testing Documentation

## Test Categories

### 1. Core Tests
- **Cache Tests** (`test_cache.py`, `test_cache_invalidation.py`)
  - Redis configuration and connection
  - Cache key management
  - Cache invalidation
  - Concurrent access
  - Memory usage
  - Race conditions

- **Logging Tests** (`test_logging.py`)
  - Log file creation and rotation
  - Log level filtering
  - Message formatting
  - Concurrent logging
  - Performance impact

- **Database Tests** (`test_db_config.py`, `test_db_pool.py`)
  - Connection pool management
  - Transaction handling
  - Concurrent access
  - Error handling
  - Performance monitoring

### 2. API Tests
- **Language Management** (`test_languages.py`)
  - Language CRUD operations
  - Language pair management
  - Validation and constraints
  - Error handling

- **Vocabulary Groups** (`test_vocabulary_groups.py`)
  - Group creation and management
  - Vocabulary assignment
  - Bulk operations
  - Statistics calculation

- **Progress Tracking** (`test_progress.py`)
  - Progress recording
  - Success rate calculation
  - Mastery tracking
  - Session management

- **Statistics** (`test_statistics.py`)
  - Overall statistics
  - Time-based analysis
  - Activity type metrics
  - Learning curves
  - Performance metrics

- **Health Checks** (`test_health.py`)
  - Basic health status
  - Component health
  - Resource monitoring
  - Performance metrics
  - Maintenance mode

### 3. Model Tests
- **Base Model** (`test_base_model.py`)
  - Model initialization
  - Validation
  - Serialization
  - Relationship handling

- **Activity Models** (`test_session_model.py`)
  - Session management
  - Attempt tracking
  - Progress calculation
  - Statistics aggregation

### 4. Middleware Tests
- **Performance Middleware** (`test_performance.py`)
  - Request timing
  - Slow request detection
  - Header management
  - Logging integration

- **Middleware Chain** (`test_middleware_chain.py`)
  - Order execution
  - Error handling
  - Request/Response modification
  - State management

## Running Tests

### Basic Test Execution
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/api/test_languages.py

# Run with coverage report
pytest --cov=app tests/
```

### Test Configuration
Tests use a separate database and Redis instance:
- Test database: SQLite (`:memory:` or temporary file)
- Test Redis database: DB index 1 (separate from production)

### Test Fixtures
Common fixtures in `conftest.py`:
- `client`: FastAPI test client
- `db_session`: Database session
- `test_language`: Sample language
- `test_vocabulary`: Sample vocabulary
- `test_activity`: Sample activity

## Coverage Requirements

Each component should maintain minimum coverage:
- Core components: 95%
- API endpoints: 90%
- Models: 85%
- Middleware: 80%

## Writing New Tests

### Test Structure
```python
def test_feature_name():
    """Test description."""
    # 1. Setup
    test_data = create_test_data()
    
    # 2. Execute
    result = execute_function(test_data)
    
    # 3. Assert
    assert result.status_code == 200
    assert result.data == expected_data
```

### Best Practices
1. Use descriptive test names
2. Include docstrings
3. Follow AAA pattern (Arrange, Act, Assert)
4. Test edge cases
5. Clean up test data

## Continuous Integration
Tests run automatically on:
- Pull requests
- Merge to main branch
- Release tags

### CI Pipeline
1. Install dependencies
2. Run linters
3. Execute tests
4. Generate coverage report
5. Check coverage thresholds

## Performance Testing
- Response time thresholds
- Concurrent request handling
- Memory usage limits
- Database query optimization

## Security Testing
- Input validation
- Authentication/Authorization
- Data sanitization
- Error handling

## Troubleshooting
Common test issues and solutions:
1. Database connection errors
   - Check test database configuration
   - Verify migrations
   
2. Redis connection issues
   - Ensure Redis is running
   - Check test Redis database
   
3. Failing tests
   - Check test data setup
   - Verify environment variables
   - Review recent changes 