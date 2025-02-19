# Language Learning Portal Backend

A privacy-focused, local-first backend implementation for the Language Learning Portal.

## Core Design Principles

1. **Local-First Architecture**
   - No external dependencies
   - All data stored locally
   - No CORS, external APIs, or remote resources

2. **Privacy by Design**
   - Minimal data collection
   - No tracking or analytics
   - Privacy-focused caching
   - GDPR compliant by default

3. **Accessibility**
   - WCAG 2.1 AAA compliance
   - Screen reader support
   - Keyboard navigation
   - High contrast support

## Setup

### Prerequisites
- Python 3.12+
- Nginx
- Node.js 18+ (for frontend)

### Installation

1. Create virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Initialize database:
```bash
alembic upgrade head
```

4. Start the application:
```bash
./scripts/start.sh
```

## Architecture

### Local-Only Implementation
- FastAPI backend running on localhost only
- File-based SQLite database
- Local file-based caching
- Nginx reverse proxy for security

### Security Features
- No external connections
- Strict CSP headers
- Local-only access
- Minimal data collection

### Caching Strategy
- Privacy-focused file-based cache
- No user tracking
- Minimal session data
- Automatic cache cleanup

## API Endpoints

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/progress` - Get learning progress
- `GET /api/v1/dashboard/latest-sessions` - Get recent sessions

All endpoints are cached locally with privacy-preserving mechanisms.

## Development vs Production Mode

### Development Mode

Development mode provides additional tools and features for local development while maintaining privacy and security principles:

#### Features
- Interactive API documentation (Swagger UI) at `/docs`
- ReDoc alternative documentation at `/redoc`
- OpenAPI schema at `/openapi.json`
- Auto-reload on code changes
- Detailed error messages
- Local-only access

#### Security Measures
- Documentation only accessible from localhost
- All security headers enforced
- No data collection or tracking
- External access blocked
- No persistent data storage

#### Known Issues and Solutions

##### Swagger UI in Development Mode

If you see a blank screen at `/docs` with CSP violations in the console:

1. **Install Swagger UI locally**:
```bash
# From the backend directory
mkdir -p static/swagger-ui
cd static/swagger-ui

# Download main assets
wget https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js
wget https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css
wget https://fastapi.tiangolo.com/img/favicon.png

# Download source maps for development
wget https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js.map
wget https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css.map
```

2. **Update CSP Headers**

The security middleware needs to be updated to allow Swagger UI in development mode. The CSP headers should be:

```python
# In development mode
response.headers["Content-Security-Policy"] = (
    "default-src 'self'; "
    "img-src 'self' data:; "
    "style-src 'self' 'unsafe-inline'; "
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    "font-src 'self' data:;"
)
```

3. **Configure FastAPI to use local Swagger UI**:
```python
app = FastAPI(
    title="Language Learning Portal" + (" (Development Mode)" if DEV_MODE else ""),
    docs_url="/docs" if DEV_MODE else None,
    swagger_ui_oauth2_redirect_url=None,
    swagger_ui_parameters={"defaultModelsExpandDepth": -1},
    swagger_ui_init_oauth={},
)
```

4. **Verify Installation**:
- Clear browser cache
- Restart the development server
- Access `/docs` endpoint
- Check browser console for any remaining CSP violations

The Swagger UI should now load properly while maintaining our security principles by serving all resources locally.

#### Starting Development Mode
```bash
# From the backend directory
./scripts/start-dev.sh
```

The development server will start at `http://localhost:8000` with:
- API documentation at `http://localhost:8000/docs`
- Alternative documentation at `http://localhost:8000/redoc`
- Auto-reload enabled
- Debug information available

### Production Mode

Production mode enforces maximum security and privacy measures:

#### Features
- API documentation disabled
- Nginx reverse proxy
- Frontend integration
- Maximum security headers
- Local-only enforcement
- Privacy-first approach

#### Security Measures
- No API documentation exposed
- Strict CSP headers
- No external connections
- No data collection
- Local-only access enforced
- Privacy-preserving caching

#### Starting Production Mode
```bash
# From the backend directory
./scripts/start.sh
```

The production server will:
- Build the frontend
- Start the backend API
- Configure Nginx
- Enable all security measures
- Disable documentation

### Environment Comparison

| Feature                    | Development     | Production      |
|---------------------------|-----------------|-----------------|
| API Documentation         | ✅ Enabled      | ❌ Disabled     |
| Auto-Reload              | ✅ Enabled      | ❌ Disabled     |
| Detailed Errors          | ✅ Enabled      | ❌ Disabled     |
| Security Headers         | ✅ Enabled      | ✅ Enabled      |
| Local-Only Access        | ✅ Enabled      | ✅ Enabled      |
| Nginx Integration        | ❌ Disabled     | ✅ Enabled      |
| Frontend Build           | ❌ Disabled     | ✅ Enabled      |
| Privacy Protection       | ✅ Enabled      | ✅ Enabled      |
| Cache Implementation     | ✅ Local File   | ✅ Local File   |
| External Connections     | ❌ Blocked      | ❌ Blocked      |

### Security Considerations

Both modes maintain strict security and privacy measures:

1. **Local-Only Access**
   - All endpoints restricted to localhost
   - External connections blocked
   - No CORS headers

2. **Privacy Protection**
   - No data collection
   - No analytics
   - No tracking
   - No external services

3. **Security Headers**
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Referrer-Policy: strict-origin-when-cross-origin, same-origin
   Permissions-Policy: interest-cohort=()
   Content-Security-Policy: default-src 'self'
   ```

4. **Cache Security**
   - File-based local cache
   - No sensitive data storage
   - Automatic expiration
   - Secure file permissions

### Development Guidelines

1. **Using API Documentation**
   - Access Swagger UI at `/docs` in development mode
   - Test endpoints directly in the browser
   - View request/response schemas
   - Try out API calls

2. **Making Changes**
   - Auto-reload will detect file changes
   - Security headers are always enforced
   - Test both development and production modes
   - Verify privacy measures remain intact

3. **Testing Security**
   - Verify external access is blocked
   - Check security headers are present
   - Ensure no data leakage
   - Test privacy features

4. **Production Deployment**
   - Always use `start.sh` for production
   - Verify documentation is disabled
   - Check all security headers
   - Test local-only access

### Troubleshooting

1. **Development Mode**
   ```bash
   # Check if development server is running
   curl http://localhost:8000/health
   
   # Verify docs are accessible locally
   curl http://localhost:8000/docs
   
   # Check security headers
   curl -I http://localhost:8000/health
   ```

2. **Production Mode**
   ```bash
   # Verify production is running
   curl http://localhost:8000/health
   
   # Confirm docs are disabled
   curl http://localhost:8000/docs  # Should return 404
   
   # Check Nginx integration
   curl -I http://localhost:8000/api/v1/health
   ```

### Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Nginx Configuration Guide](./scripts/nginx.conf)
- [Security Headers Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)

## Development

### Running Tests
```bash
pytest
```

### Code Style
```bash
black .
flake8
mypy .
```

### Database Migrations
```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Privacy Considerations

### Data Storage
- All data stored locally
- No external services
- Minimal logging
- Privacy-first caching

### User Data
- No tracking
- No analytics
- No external requests
- No user profiling

## Deployment

The application is designed to run locally only. Deploy using the provided Nginx configuration:

1. Update paths in `scripts/nginx.conf`
2. Start the application:
```bash
./scripts/start.sh
```

## Contributing

1. Ensure changes maintain privacy focus
2. No external dependencies
3. Local-first approach
4. Follow accessibility guidelines

## License

MIT License - See LICENSE file for details
