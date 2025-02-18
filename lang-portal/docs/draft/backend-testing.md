# Test Fixtures Documentation

## Overview
All test fixtures are defined in `tests/conftest.py`. These fixtures provide reusable test data and utilities for both database and API tests.

## Fixture Scopes

### Module-Level Fixtures

```python
@pytest.fixture(scope="module")
def client():
"""FastAPI test client for API testing"""
```
## Test Fixtures
Our test fixtures are defined in `tests/conftest.py` and provide reusable test data.

### Fixture Hierarchy

### Language Pair Endpoints

## Test Coverage Goals
- Line coverage: >90%
- Branch coverage: >85%
- All endpoints tested
- All error conditions covered

### Function-Level Fixtures
- Initialized once per test module
- Used for stateless fixtures like the API client

## Fixture Dependencies

### Base Fixtures
- `db`: Database session
- `client`: FastAPI test client

### Model Fixtures
1. `test_language`
   - Depends on: `db`
   - Creates: English language entry

2. `test_language_pair`
   - Depends on: `db`, `test_language`
   - Creates: English-German pair

3. `test_vocabulary`
   - Depends on: `db`, `test_language_pair`
   - Creates: Test vocabulary entry

4. `test_vocabulary_group`
   - Depends on: `db`, `test_language_pair`
   - Creates: Test vocabulary group

5. `test_progress`
   - Depends on: `db`, `test_vocabulary`
   - Creates: Progress record

## Usage Examples

### In API Tests

```python
python:docs/backend/testing.md
def test_create_vocabulary(client, test_language_pair):
response = client.post(
"/vocabularies/",
json={
"word": "test",
"translation": "test",
"language_pair_id": test_language_pair.id
}
)
assert response.status_code == 200
```
	
### In Database Tests

```python
python:docs/backend/testing.md
def test_create_language(db):
language = Language(code="fr", name="French")
db.add(language)
db.commit()
assert language.id is not None
```

## Best Practices
1. Use the most specific fixture scope needed
2. Clean up test data in fixtures using `yield`
3. Document fixture dependencies
4. Use descriptive fixture names
5. Keep fixtures focused and single-purpose

# Testing Documentation

## Test Structure and Patterns

### 1. Basic Test Structure
```python
def test_something(client, required_fixture):
    # 1. Setup
    # Create any required test data
    
    # 2. Execute
    response = client.post("/endpoint/", json={...})
    
    # 3. Assert
    assert response.status_code == expected_code
    assert response.json()["field"] == expected_value
```

### 2. Error Case Testing
```python
def test_invalid_input(client):
    response = client.post(
        "/endpoint/",
        json={"invalid": "data"}
    )
    assert response.status_code == 422
    assert "error message" in response.json()["detail"]
```

### 3. Duplicate Detection
```python
def test_create_duplicate(client):
    # First creation
    first_response = client.post(...)
    assert first_response.status_code == 200

    # Try duplicate
    second_response = client.post(...)
    assert second_response.status_code == 400
    assert "already exists" in second_response.json()["detail"]
```

### 4. Pagination Testing
```python
def test_list_pagination(client):
    # Create multiple items
    for i in range(3):
        client.post(...)
    
    # Test pagination
    response = client.get("/?skip=1&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 2
```

## Best Practices

1. **Fixture Usage**
   - Always use fixtures for test dependencies
   - Keep fixture scope as narrow as possible
   - Use descriptive fixture names

2. **Test Independence**
   - Each test should be independent
   - Clean up test data after each test
   - Don't rely on test execution order

3. **Error Testing**
   - Test both success and error cases
   - Verify error messages
   - Test boundary conditions

4. **Assertions**
   - Use specific assertions
   - Check both status codes and response content
   - Verify database state when needed

5. **Test Names**
   - Use descriptive test names
   - Include the scenario being tested
   - Follow `test_<action>_<scenario>` pattern

## Common Test Patterns

### 1. Create-Read-Update-Delete (CRUD)
```python
def test_create_resource(client):
    response = client.post("/resource/", json={...})
    assert response.status_code == 200
    return response.json()

def test_get_resource(client, test_resource):
    response = client.get(f"/resource/{test_resource.id}")
    assert response.status_code == 200

def test_update_resource(client, test_resource):
    response = client.put(f"/resource/{test_resource.id}", json={...})
    assert response.status_code == 200

def test_delete_resource(client, test_resource):
    response = client.delete(f"/resource/{test_resource.id}")
    assert response.status_code == 204
```

### 2. Validation Testing
```python
def test_validation_error(client):
    response = client.post("/resource/", json={
        "invalid_field": "invalid_value"
    })
    assert response.status_code == 422
    assert "validation error message" in response.json()["detail"]
```