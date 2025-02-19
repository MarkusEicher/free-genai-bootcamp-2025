# Test Fixtures

This directory contains test fixtures used across multiple endpoint tests. The fixtures are organized by their purpose and the components they support.

## Organization

Each endpoint directory has its own `fixtures/` subdirectory containing test data specific to that endpoint. Common fixtures that are used across multiple endpoints are stored in this directory.

## Available Fixtures

### Common Fixtures (`common/fixtures/`)
- `test_data.py`: Base test data used by multiple tests
  - Languages (en, es)
  - Language pairs
  - Basic vocabulary

### Endpoint-Specific Fixtures
Each endpoint directory may contain its own fixtures in a `fixtures/` subdirectory:

```
endpoints/
├── activities/fixtures/          # Activity-specific test data
├── languages/fixtures/          # Language-specific test data
├── progress/fixtures/           # Progress-specific test data
└── vocabulary_groups/fixtures/  # Vocabulary group test data
```

## Usage

Fixtures are automatically discovered by pytest. To use them in your tests:

```python
def test_something(test_base_data, db_session):
    # Access test data
    en = test_base_data["languages"]["en"]
    es = test_base_data["languages"]["es"]
    pair = test_base_data["language_pair"]
    words = test_base_data["vocabulary"]
```

## Best Practices

1. Keep fixtures focused and minimal
2. Use descriptive names
3. Document fixture contents
4. Clean up test data
5. Use appropriate scopes
6. Share common data through fixtures
7. Avoid fixture interdependencies 