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

## References

- [FastAPI Security Documentation](https://fastapi.tiangolo.com/advanced/security/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [GDPR Compliance](https://gdpr.eu/)
- [File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [Python Privacy Best Practices](https://docs.python.org/3/library/security.html) 