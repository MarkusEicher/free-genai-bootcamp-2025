# Privacy Architecture Documentation

## Overview

The Language Learning Portal is designed with privacy-by-design principles, ensuring data protection and user privacy at every level of the application. This document outlines the privacy features, implementation details, and best practices.

## Core Privacy Features

### 1. Local-Only Access
- Application runs exclusively on localhost
- External connections are blocked by multiple layers:
  - Nginx configuration
  - Privacy middleware
  - Frontend API configuration

### 2. Data Protection

#### Request/Response Privacy
- Sensitive parameter filtering
- Response data sanitization
- Privacy-focused headers
- No tracking or analytics
- No cookies or session data

#### Cache Privacy
- Local file-based caching only
- Secure cache file deletion
- Data sanitization in cache
- Expiration handling
- No persistent identifiers

#### Logging Privacy
- Privacy-focused formatter
- Secure log rotation
- Data sanitization in logs
- Minimal logging in production
- No sensitive data logging

### 3. Route-Specific Privacy Rules

#### Dashboard Routes
```python
{
    "cache_control": "no-store, max-age=0",
    "sanitize_response": True,
    "allow_query_params": {"limit", "offset"}
}
```

#### Vocabulary Routes
```python
{
    "cache_control": "private, max-age=300",
    "sanitize_response": True,
    "allow_query_params": {"limit", "offset", "sort", "filter"}
}
```

#### Session Routes
```python
{
    "cache_control": "no-store, no-cache, must-revalidate",
    "sanitize_response": True,
    "allow_query_params": {"limit"}
}
```

### 4. Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Comprehensive `Permissions-Policy`
- `X-Privacy-Mode: strict` (or `development` in dev mode)

## Implementation Details

### Privacy Middleware Chain

1. **Global Privacy Middleware** (`PrivacyMiddleware`)
   - Enforces local-only access
   - Filters sensitive parameters
   - Adds base privacy headers

2. **Route Privacy Middleware** (`RoutePrivacyMiddleware`)
   - Applies route-specific rules
   - Sanitizes responses
   - Manages cache controls

3. **Security Middleware** (`SecurityMiddleware`)
   - Adds security headers
   - Enforces CSP
   - Blocks unwanted features

### Data Sanitization Patterns

```python
sensitive_patterns = [
    (r'"id":\s*\d+', '"id": "[ID]"'),
    (r'"created_at":\s*"[^"]*"', '"created_at": "[TIMESTAMP]"'),
    (r'"updated_at":\s*"[^"]*"', '"updated_at": "[TIMESTAMP]"'),
    (r'"ip":\s*"[^"]*"', '"ip": "[REDACTED]"'),
    (r'"user_agent":\s*"[^"]*"', '"user_agent": "[REDACTED]"'),
    (r'"session_id":\s*"[^"]*"', '"session_id": "[REDACTED]"'),
    (r'"token":\s*"[^"]*"', '"token": "[REDACTED]"')
]
```

## Development Guidelines

### 1. API Endpoints
- Use route-specific privacy rules
- Implement proper data sanitization
- Follow the principle of least privilege
- Document privacy requirements

### 2. Frontend Development
- Use the provided `fetchApi` wrapper
- Implement client-side data sanitization
- Avoid storing sensitive data
- Use privacy-focused components

### 3. Testing
- Include privacy-focused test cases
- Verify data sanitization
- Check header presence
- Test privacy rules

### 4. Cache Management
- Use appropriate cache durations
- Implement secure deletion
- Sanitize cached data
- Handle expiration properly

## Production Deployment

### 1. Environment Setup
- Set `DEV_MODE=false`
- Configure proper file permissions
- Set up secure log rotation
- Enable privacy monitoring

### 2. Monitoring
- Check privacy header presence
- Monitor cache usage
- Review log sanitization
- Track privacy violations

### 3. Maintenance
- Regular privacy audits
- Update security headers
- Review cache policies
- Update sanitization patterns

## Privacy Compliance

The application is designed to comply with:
- GDPR principles
- Data minimization
- Purpose limitation
- Storage limitation
- Data protection by design

## Best Practices

1. **Data Collection**
   - Collect only necessary data
   - Implement data minimization
   - Use privacy-preserving alternatives

2. **Data Storage**
   - Use local storage only
   - Implement secure deletion
   - Handle data expiration

3. **Data Access**
   - Enforce local-only access
   - Implement proper authentication
   - Use role-based access control

4. **Data Protection**
   - Sanitize sensitive data
   - Use secure communication
   - Implement proper encryption

## Testing Privacy Features

Run the comprehensive test suite:
```bash
python -m pytest tests/middleware/test_privacy.py
python -m pytest tests/middleware/test_route_privacy.py
python -m pytest tests/core/test_privacy.py
```

## References

- [FastAPI Security Documentation](https://fastapi.tiangolo.com/advanced/security/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [GDPR Compliance](https://gdpr.eu/) 