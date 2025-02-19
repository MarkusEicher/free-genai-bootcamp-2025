# Test Organization

This directory contains all tests for the backend application. Tests are organized by their purpose and the components they test:

## Directory Structure

- `api/` - API endpoint tests
- `core/` - Core functionality tests
- `db/` - Database and model tests
- `middleware/` - Middleware component tests
- `schemas/` - Schema validation tests
- `services/` - Service layer tests
- `utils/` - Test utilities and fixtures

## Test Files

All test files follow these naming conventions:
- Start with `test_`
- Describe what they test
- End with appropriate suffix (_api.py, _test.py, etc.)

## Configuration

- `conftest.py` - Contains all shared fixtures and test configuration
- `utils/fixtures/` - Contains test data and fixtures
- `utils/helpers/` - Contains test helper functions

## Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/api/v1/test_endpoints.py

# Run tests with coverage
pytest --cov=app tests/
```
