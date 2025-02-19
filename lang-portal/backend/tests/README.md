# Language Learning Portal Tests

This directory contains all tests for the Language Learning Portal backend. The tests are organized by category and follow privacy-first, local-only design principles.

## Directory Structure

```
tests/
├── api/                    # API endpoint tests
│   └── v1/
│       └── endpoints/      # Feature-specific endpoint tests
├── core/                   # Core functionality tests
│   ├── test_cache.py      # Local caching tests
│   └── test_config.py     # Configuration tests
├── db/                     # Database tests
├── integration/           # Integration tests
│   └── test_nginx.py      # Nginx configuration tests
├── middleware/            # Middleware tests
├── performance/          # Performance tests
├── schemas/              # Schema validation tests
├── services/             # Service layer tests
├── utils/                # Utility function tests
├── conftest.py          # Shared test fixtures
└── README.md            # This file
```

## Test Categories

### 1. API Tests (`/api`)
- Endpoint functionality
- Request/response validation
- Error handling
- See detailed documentation in [API Endpoint Tests](api/v1/endpoints/README.md)

### 2. Core Tests (`/core`)
- Local caching implementation
- Configuration management
- Privacy features
- Security measures

### 3. Integration Tests (`/integration`)
- Nginx configuration
- Local-only access
- Security headers
- Static file serving

### 4. Privacy Tests
Tests marked with `@pytest.mark.privacy` verify:
- No external connections
- Minimal data collection
- Privacy-preserving caching
- GDPR compliance

### 5. Security Tests
Tests marked with `@pytest.mark.security` verify:
- Local-only access
- Header configuration
- Data protection
- Error information leakage

## Configuration

All test configuration is centralized in `pyproject.toml` under `[tool.pytest.ini_options]`:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
    "privacy: Tests for privacy-focused features",
    "security: Tests for security features",
    "integration: Integration tests",
    "cache: Tests for caching functionality",
    "api: Tests for API endpoints"
]
```

## Running Tests

### All Tests
```bash
pytest
```

### Specific Categories
```bash
# Privacy tests
pytest -m privacy

# Security tests
pytest -m security

# API tests
pytest tests/api/

# Integration tests
pytest tests/integration/
```

### With Coverage
```bash
pytest --cov=app --cov-report=html
```

## Test Environment

Tests run with these privacy-focused settings:
- `TESTING=1`
- `CACHE_DIR=./data/test_cache`
- `LOG_LEVEL=ERROR`
- `COLLECT_METRICS=0`
- `ENABLE_LOGGING=0`

## Common Fixtures

Shared test fixtures in `conftest.py` include:
- Database sessions
- Test client
- Cache management
- Test data factories

## Best Practices

### 1. Privacy First
- No external service dependencies
- No tracking or analytics
- Minimal data collection
- Local-only testing

### 2. Test Organization
- Group related tests in appropriate directories
- Use meaningful test names
- Include docstrings
- Follow naming conventions

### 3. Test Data
- Use fixtures for common data
- Clean up after tests
- Don't leak sensitive information
- Use appropriate scopes

### 4. Performance
- Clean cache between tests
- Use appropriate database isolation
- Minimize file I/O
- Handle resources properly

### 5. Documentation
- Document test purpose
- Explain complex test setups
- Include examples
- Keep READMEs updated

## Adding New Tests

1. Choose appropriate directory
2. Follow existing patterns
3. Add necessary fixtures
4. Include documentation
5. Add privacy/security markers if applicable

## Coverage Requirements

- Minimum coverage: 90%
- Critical paths: 100%
- Privacy features: 100%
- Security features: 100%

## Debugging Tests

### Logging
```bash
pytest --log-cli-level=DEBUG
```

### Specific Tests
```bash
pytest -v test_file.py::test_function
```

### Cache Inspection
```bash
pytest --cache-clear
pytest --cache-show
```

## Contributing

1. Follow privacy-first principles
2. Add appropriate markers
3. Include documentation
4. Maintain coverage
5. Test edge cases

## Related Documentation

- [API Endpoint Tests](api/v1/endpoints/README.md)
- [Integration Tests](integration/README.md)
- [Performance Tests](performance/README.md)
