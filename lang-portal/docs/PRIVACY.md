# Privacy Features Documentation

## Overview

This document outlines the privacy features implemented in the Language Learning Portal, ensuring data protection, secure file handling, and compliance with privacy standards.

## Core Privacy Features

### 1. Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: Strict configuration for resources
- Permissions-Policy: Restrictive settings for browser features

### 2. Local-Only Access
- Application restricted to localhost/127.0.0.1
- External access blocked by security middleware
- No CORS headers to prevent external access

### 3. File Privacy

#### Secure File Handler
- Thread-safe file operations
- File size limits (10MB per file)
- Storage quota management (20MB total)
- Secure file deletion with data overwriting
- Path traversal protection
- Filename sanitization

#### Supported File Types
- Images: .jpg, .jpeg, .png, .gif
- Documents: .pdf, .txt, .md
- Audio: .mp3, .wav, .ogg, .m4a

#### Privacy Features
- Metadata stripping from images
- Audio file metadata handling
- Secure temporary storage
- Proper file permissions (0o600)
- Quota tracking and enforcement

### 4. Data Protection

#### Request/Response Privacy
- Query parameter sanitization
- Sensitive data filtering
- Header sanitization
- No tracking or analytics
- No persistent identifiers

#### Cache Privacy
- Private cache implementation
- Secure cache cleanup
- No sensitive data in cache
- Automatic cache expiration

#### Session Privacy
- Minimal session data
- No persistent sessions
- Secure session cleanup
- No user tracking

## Testing Privacy Features

### Core Privacy Tests
```bash
# Run all privacy-related tests
python -m pytest -v -m privacy

# Run specific test suites
python -m pytest tests/middleware/test_privacy.py
python -m pytest tests/middleware/test_route_privacy.py
python -m pytest tests/core/test_privacy.py
python -m pytest tests/core/test_file_privacy.py
```

### Test Categories
- File privacy tests
- Route-specific privacy tests
- Cache privacy tests
- Header verification tests
- Data sanitization tests
- Access control tests

## Implementation Details

### Middleware Chain
1. SecurityMiddleware
   - Enforces security headers
   - Blocks external access
   - Manages CSP

2. PrivacyMiddleware
   - Filters sensitive data
   - Enforces local-only access
   - Removes tracking headers

3. RoutePrivacyMiddleware
   - Route-specific privacy rules
   - Query parameter validation
   - Response sanitization

### File Handling
```python
from app.core.file_handler import SecureFileHandler

# Initialize handler
handler = SecureFileHandler(base_dir="/path/to/storage")

# Save file with privacy features
file_path = await handler.save_file(
    file=upload_file,
    strip_metadata=True
)

# Get quota information
quota_info = handler.get_quota_info()

# Secure file deletion
handler.secure_delete(file_path)
```

## Configuration

### Development Mode
```bash
# Start in development mode (allows API docs)
./scripts/start-dev.sh

# Note: Even in dev mode, privacy features remain active
```

### Production Mode
```bash
# Start in production mode (maximum privacy)
./scripts/start.sh
```

## Compliance

### GDPR Considerations
- No personal data collection
- No tracking or profiling
- Data minimization
- Secure data handling
- Right to be forgotten (file deletion)

### Security Standards
- OWASP Security Headers
- Secure File Upload Handling
- Safe File Operations
- Privacy by Design

## Developer Checklist

### New Feature Development
- [ ] Verify local-only access restrictions
- [ ] Implement route-specific privacy rules
- [ ] Add appropriate security headers
- [ ] Sanitize request/response data
- [ ] Handle file operations securely
- [ ] Add privacy-focused test cases
- [ ] Document privacy considerations

### File Handling
- [ ] Use SecureFileHandler for all file operations
- [ ] Validate file extensions before processing
- [ ] Strip metadata from uploaded files
- [ ] Check file size against limits
- [ ] Verify storage quota compliance
- [ ] Implement secure file deletion
- [ ] Set correct file permissions

### Data Protection
- [ ] Remove sensitive data from logs
- [ ] Sanitize cache entries
- [ ] Clear expired sessions
- [ ] Validate query parameters
- [ ] Check response headers
- [ ] Remove tracking information
- [ ] Verify GDPR compliance

### Testing
- [ ] Run privacy test suite
- [ ] Verify header presence
- [ ] Check data sanitization
- [ ] Test file operations
- [ ] Validate quota enforcement
- [ ] Check concurrent access
- [ ] Test error scenarios

## Troubleshooting Guide

### Common Issues

#### 1. External Access Blocked
**Symptom**: Unable to access API from external tools
```
Access denied: Local-only application
```
**Solution**:
- Verify you're accessing via localhost/127.0.0.1
- Check if running in development mode
- Review SecurityMiddleware configuration

#### 2. File Upload Failures
**Symptom**: File uploads return 413 status code
```python
HTTPException: File size exceeds limit
```
**Solutions**:
- Check file size (max 10MB)
- Verify available quota (max 20MB total)
- Ensure valid file extension
- Check file permissions

#### 3. Missing Security Headers
**Symptom**: Security headers not present in response
```
Missing required security headers: X-Content-Type-Options
```
**Solutions**:
- Verify middleware chain order
- Check SecurityMiddleware configuration
- Review route-specific header settings
- Enable debug logging for middleware

#### 4. Cache Privacy Issues
**Symptom**: Sensitive data appears in cache
```
Privacy violation: Sensitive data found in cache
```
**Solutions**:
- Review cache sanitization patterns
- Check cache expiration settings
- Clear cache and verify cleanup
- Update privacy patterns

#### 5. Metadata Stripping Failures
**Symptom**: File metadata not properly stripped
```python
Metadata found in processed file
```
**Solutions**:
- Verify file type detection
- Check metadata stripping implementation
- Update supported file types
- Add specific metadata patterns

### Debug Mode

Enable debug mode for privacy features:
```python
# In development.env
PRIVACY_DEBUG=true
PRIVACY_LOG_LEVEL=DEBUG
```

Debug output will show:
- Header modifications
- Data sanitization steps
- File operation details
- Cache operations
- Privacy rule applications

### Logging

Configure privacy-focused logging:
```python
from app.core.logging import setup_logging

logger = setup_logging(
    privacy_mode=True,
    log_level="DEBUG",
    sanitize_patterns=["email", "ip", "token"]
)
```

### Performance Impact

Privacy features may impact performance:
- File metadata stripping: 100-200ms per file
- Data sanitization: 10-20ms per request
- Header validation: 5-10ms per request
- Cache operations: 20-30ms additional latency

Optimize by:
1. Implementing caching where appropriate
2. Batch processing files when possible
3. Using async operations for I/O
4. Adjusting sanitization patterns

## Best Practices

### 1. File Operations
```python
async def handle_file_upload(file: UploadFile):
    handler = SecureFileHandler(settings.UPLOAD_DIR)
    
    # Validate before processing
    if not handler._is_allowed_extension(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        # Save with privacy features
        file_path = await handler.save_file(
            file=file,
            strip_metadata=True
        )
        
        # Check quota after save
        quota = handler.get_quota_info()
        if quota["used_percentage"] > 90:
            logger.warning("Storage quota near limit")
            
        return file_path
        
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail="File processing failed")
```

### 2. Data Sanitization
```python
def sanitize_response(data: dict) -> dict:
    sensitive_fields = {
        "email", "password", "token", "ip_address",
        "session_id", "device_id", "location"
    }
    
    def _sanitize(item: Any) -> Any:
        if isinstance(item, dict):
            return {
                k: "[REDACTED]" if k in sensitive_fields else _sanitize(v)
                for k, v in item.items()
            }
        elif isinstance(item, list):
            return [_sanitize(i) for i in item]
        return item
    
    return _sanitize(data)
```

### 3. Header Management
```python
def verify_privacy_headers(headers: Dict[str, str]) -> bool:
    required_headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }
    
    return all(
        headers.get(header) == value
        for header, value in required_headers.items()
    )
```

## References

- [FastAPI Security Documentation](https://fastapi.tiangolo.com/advanced/security/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [GDPR Compliance](https://gdpr.eu/)
- [File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [Python Privacy Best Practices](https://docs.python.org/3/library/security.html) 