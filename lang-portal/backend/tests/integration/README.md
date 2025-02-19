# Integration Tests

This directory contains integration tests that verify the complete system behavior, focusing on local-only access and privacy features.

## Test Categories

### 1. Nginx Configuration (`test_nginx.py`)
- Local-only access enforcement
- Security headers
- Static file serving
- Font file handling
- Hidden file protection
- Proxy configuration

### 2. Local Storage (`test_storage.py`)
- SQLite database access
- File-based caching
- Static file management
- Font file serving

### 3. Privacy Features (`test_privacy.py`)
- No external connections
- Header sanitization
- Data isolation
- Cache privacy

## Running Tests

```bash
# Run all integration tests
pytest tests/integration/

# Run specific test file
pytest tests/integration/test_nginx.py

# Run with detailed output
pytest -v tests/integration/
```

## Test Requirements

### System Requirements
- Nginx
- Python 3.12+
- SQLite
- Local file system access

### Environment Setup
```bash
# Install Nginx (Ubuntu/Debian)
sudo apt-get install nginx

# Install Nginx (macOS)
brew install nginx

# Configure Nginx
cp scripts/nginx.conf /etc/nginx/conf.d/
```

## Test Structure

### 1. Setup Phase
- Configure test environment
- Start required services
- Prepare test data

### 2. Test Execution
- Verify local-only access
- Check security headers
- Test file serving
- Validate privacy features

### 3. Cleanup
- Stop services
- Remove test data
- Clean cache

## Common Fixtures

```python
@pytest.fixture(scope="module")
def nginx_server():
    """Start Nginx server for testing."""
    # Setup code
    yield
    # Cleanup code

@pytest.fixture
def test_storage():
    """Configure test storage."""
    # Setup code
    yield
    # Cleanup code
```

## Best Practices

### 1. Local-Only Testing
- Never make external connections
- Use localhost for all services
- Verify connection restrictions

### 2. Privacy Protection
- No logging of sensitive data
- Clean all test data
- Verify header sanitization

### 3. Resource Management
- Clean up after tests
- Handle service shutdown
- Manage test files

## Example Test

```python
def test_local_only_access(nginx_server):
    """Test that only local connections are accepted."""
    # Test localhost access
    response = requests.get("http://localhost:8000/health")
    assert response.status_code == 200
    
    # Test non-local access (should fail)
    with pytest.raises(requests.exceptions.ConnectionError):
        requests.get("http://example.com:8000/health")
```

## Common Issues

### 1. Nginx Configuration
- Permission issues
- Port conflicts
- Configuration syntax

### 2. File Access
- Permission denied
- Path resolution
- File cleanup

### 3. Service Management
- Service already running
- Port in use
- Cleanup failures

## Debugging

### 1. Nginx Logs
```bash
tail -f /var/log/nginx/error.log
```

### 2. Test Verbosity
```bash
pytest -vv tests/integration/
```

### 3. Service Status
```bash
systemctl status nginx
```

## Adding New Tests

1. Choose appropriate test file
2. Add necessary fixtures
3. Implement setup/cleanup
4. Document requirements
5. Follow privacy guidelines

## Security Considerations

1. Local-Only Access
   - Verify connection restrictions
   - Check header configurations
   - Test access controls

2. Data Protection
   - Clean sensitive data
   - Verify header sanitization
   - Check error responses

3. Resource Isolation
   - Use test-specific paths
   - Clean up all resources
   - Verify file permissions 