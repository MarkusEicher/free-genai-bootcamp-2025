# API Endpoint Tests

This directory contains tests for all API endpoints, organized by feature area. Each feature area has its own directory containing multiple test files that cover different aspects of the functionality.

## Directory Structure

```
endpoints/
├── activities/          # Activity and practice session endpoints
│   ├── test_advanced.py  # Complex activity operations
│   ├── test_basic.py     # Basic CRUD operations
│   └── test_practice.py  # Practice-specific functionality
├── common/             # Cross-cutting API test concerns
│   ├── test_endpoints.py # General endpoint behavior
│   └── test_error_handling.py # Error handling across endpoints
├── dashboard/          # Dashboard and analytics endpoints
│   └── test_advanced.py  # Complex dashboard operations
├── languages/          # Language management endpoints
│   ├── test_advanced.py  # Complex language operations
│   └── test_basic.py     # Basic CRUD operations
├── language_pairs/     # Language pair management endpoints
│   └── test_basic.py     # Basic CRUD operations
├── progress/           # Progress tracking endpoints
│   ├── test_advanced.py  # Complex progress calculations
│   └── test_basic.py     # Basic progress operations
├── statistics/         # Statistics endpoints
│   ├── test_advanced.py  # Complex statistical analysis
│   └── test_basic.py     # Basic statistics operations
├── vocabularies/       # Vocabulary management endpoints
│   └── test_basic.py     # Basic CRUD operations
└── vocabulary_groups/  # Vocabulary group endpoints
    ├── test_advanced.py  # Complex group operations
    └── test_basic.py     # Basic CRUD operations
```

## Test File Organization

Each feature area typically includes these types of test files:

### test_basic.py
- Basic CRUD operations (Create, Read, Update, Delete)
- Input validation
- Error handling for common cases
- Permission checks
- Simple queries

### test_advanced.py
- Complex operations
- Edge cases
- Performance considerations
- Advanced queries
- Integration with other features
- Bulk operations
- Cache behavior

### test_practice.py (Activities only)
- Practice session management
- Session attempts
- Progress tracking during practice
- Practice direction handling
- Real-time statistics

### Common Tests (in common/)
- General endpoint behavior
- Error handling patterns
- Cross-cutting concerns
- HTTP status codes
- Request/response formats
- Validation errors
- Database errors
- Transaction handling

## Running Tests

You can run tests for specific features:

```bash
# Run all API tests
pytest tests/api/v1/endpoints/

# Run tests for a specific feature
pytest tests/api/v1/endpoints/activities/

# Run specific test file
pytest tests/api/v1/endpoints/activities/test_practice.py

# Run with coverage
pytest tests/api/v1/endpoints/ --cov=app.api.v1.endpoints
```

## Adding New Tests

When adding new tests:
1. Place them in the appropriate feature directory
2. Choose the appropriate test file based on the functionality being tested
3. Follow the existing naming and organization patterns
4. Add docstrings explaining the test purpose
5. Use the common fixtures from `tests/conftest.py`

## Common Fixtures

Common test fixtures are available in `tests/conftest.py`, including:
- `client`: FastAPI test client
- `db_session`: Database session
- `test_language`: Test language instance
- `test_language_pair`: Test language pair
- `test_vocabulary`: Test vocabulary item
- `test_vocabulary_group`: Test vocabulary group
- `test_activity`: Test activity
- And more...

## Best Practices

1. Keep test files focused and organized
2. Use descriptive test names
3. Include docstrings for test functions
4. Use appropriate fixtures
5. Clean up test data
6. Handle edge cases
7. Test both success and failure scenarios