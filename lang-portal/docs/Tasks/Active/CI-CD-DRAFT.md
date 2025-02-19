# CI/CD Strategy and Deployment Configuration

## Table of Contents
1. [Overview](#overview)
2. [Current Development Setup](#current-development-setup)
3. [Planned Deployment Strategy](#planned-deployment-strategy)
4. [Environment Configurations](#environment-configurations)
5. [Nginx Configuration](#nginx-configuration)
6. [Docker Strategy](#docker-strategy)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Security Considerations](#security-considerations)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Integration Points](#integration-points)
11. [Implementation Timeline](#implementation-timeline)

## Overview

This document outlines the CI/CD strategy and deployment configuration for the Language Learning Portal, with a focus on maintaining development simplicity while planning for robust production deployment.

### Project Context
- Frontend: React/TypeScript SPA
- Backend: FastAPI Python application
- Current Stage: Active Development
- Target: Production-ready deployment pipeline

## Current Development Setup

### Local Development Workflow
```bash
# Frontend Development
cd frontend
npm install
npm run dev  # Vite development server

# Backend Development
cd backend
poetry install
poetry run python -m uvicorn app.main:app --reload
```

This workflow will remain unchanged during the planning and initial implementation phases of our CI/CD strategy.

## Planned Deployment Strategy

### Phase 1: Development and Staging
- Maintain current local development workflow
- Implement CI pipeline for testing and building
- Set up staging environment with Docker
- Implement automated testing

### Phase 2: Production Preparation
- Implement production Docker configuration
- Set up monitoring and logging
- Configure CDN and caching strategies
- Implement blue-green deployment capability

### Phase 3: Production Deployment
- Full production deployment
- Automated rollback capabilities
- Performance monitoring
- Security auditing

## Environment Configurations

### Directory Structure
```
frontend/
├── config/
│   ├── nginx/
│   │   ├── nginx.dev.conf    # Local development
│   │   ├── nginx.stage.conf  # Staging environment
│   │   └── nginx.prod.conf   # Production environment
│   └── environment/
│       ├── .env.development
│       ├── .env.staging
│       └── .env.production
```

### Environment Variables
```env
# .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_ENV=development

# .env.staging
VITE_API_BASE_URL=https://api.stage.langportal.com
VITE_ENV=staging

# .env.production
VITE_API_BASE_URL=https://api.langportal.com
VITE_ENV=production
```

## Nginx Configuration

### Development (nginx.dev.conf)
```nginx
# Current backend configuration (unchanged)
http {
    server {
        listen 127.0.0.1:8000;
        server_name localhost;

        location /api/ {
            proxy_pass http://127.0.0.1:8001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Production (nginx.prod.conf)
```nginx
http {
    # MIME types and default type
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Add WOFF2 MIME type
    types {
        application/font-woff2  woff2;
    }

    # Security headers
    map $sent_http_content_type $cache_control {
        default                     "no-store, no-cache, must-revalidate";
        text/css                    "public, max-age=31536000, immutable";
        application/javascript      "public, max-age=31536000, immutable";
        application/font-woff2      "public, max-age=31536000, immutable";
        ~image/                     "public, max-age=31536000, immutable";
    }

    # Logging
    log_format json_combined escape=json
        '{'
            '"time_local":"$time_local",'
            '"remote_addr":"$remote_addr",'
            '"remote_user":"$remote_user",'
            '"request":"$request",'
            '"status": "$status",'
            '"body_bytes_sent":"$body_bytes_sent",'
            '"request_time":"$request_time",'
            '"http_referrer":"$http_referer",'
            '"http_user_agent":"$http_user_agent"'
        '}';

    access_log /var/log/nginx/access.log json_combined;
    error_log /var/log/nginx/error.log warn;

    server {
        listen 80;
        server_name langportal.com;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Cache-Control $cache_control;
        add_header Permissions-Policy "interest-cohort=()" always;

        # Font files caching
        location ~* \.(woff2?)$ {
            add_header Cache-Control "public, max-age=31536000, immutable";
            add_header Access-Control-Allow-Origin "*";
            expires 365d;
            access_log off;
            try_files $uri =404;
        }

        # Static assets caching
        location /static/ {
            add_header Cache-Control "public, max-age=31536000, immutable";
            expires 365d;
            access_log off;
            try_files $uri =404;
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
        limit_req zone=one burst=10 nodelay;
    }
}
```

## Docker Strategy

### Development Phase
During development, we'll continue using:
- `npm run dev` for frontend
- Poetry/uvicorn for backend
- Local Nginx for API proxying

### Production Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY config/nginx/nginx.prod.conf /etc/nginx/nginx.conf
COPY public/fonts /usr/share/nginx/html/fonts

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
```

## CI/CD Pipeline

### GitHub Actions Configuration
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: |
          cd frontend
          npm install
          
      - name: Run Tests
        run: |
          cd frontend
          npm run test
          
      - name: Run Linting
        run: |
          cd frontend
          npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Environment
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "ENV=prod" >> $GITHUB_ENV
          else
            echo "ENV=stage" >> $GITHUB_ENV
          fi
          
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
          
      - name: Download Fonts
        run: |
          cd frontend
          ./scripts/download-fonts.sh

      # Future: Add Docker build and push steps
```

## Security Considerations

### Production Security Measures
1. **SSL/TLS Configuration**
   - Enforce HTTPS
   - HSTS implementation
   - Modern TLS protocols only

2. **Content Security Policy**
   ```nginx
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;" always;
   ```

3. **Rate Limiting**
   ```nginx
   limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
   limit_req zone=one burst=10 nodelay;
   ```

4. **Security Headers**
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy
   - Permissions-Policy

## Monitoring and Logging

### Logging Strategy
1. **Application Logs**
   - Error tracking
   - Performance metrics
   - User behavior analytics

2. **Nginx Logs**
   - Access logs in JSON format
   - Error logs with appropriate level
   - Request timing information

3. **Metrics Collection**
   - Response times
   - Error rates
   - Resource utilization

## Integration Points

### Backend Integration
1. **Development**
   - Local proxy configuration
   - Shared environment variables
   - Consistent error handling

2. **Production**
   - Service discovery
   - Load balancing
   - Health checks

## Implementation Timeline

### Phase 1 (Current - Month 1)
- [x] Maintain current development workflow
- [ ] Implement basic CI pipeline
- [ ] Set up automated testing
- [ ] Create Docker configurations

### Phase 2 (Month 2-3)
- [ ] Set up staging environment
- [ ] Implement monitoring
- [ ] Configure security measures
- [ ] Test deployment processes

### Phase 3 (Month 4)
- [ ] Production environment setup
- [ ] CDN integration
- [ ] Performance optimization
- [ ] Security auditing

## Next Steps

1. Review and finalize this documentation with backend team
2. Set up initial CI pipeline while maintaining current development workflow
3. Begin implementing staging environment configuration
4. Plan production security measures
5. Develop monitoring strategy

## Notes

- Current local development workflow remains unchanged
- Docker implementation will be gradual
- Security measures will be implemented in stages
- Monitoring will be added incrementally

## Core Design Principles

### 1. Privacy-First Development
- All user data processing happens locally where possible
- No unnecessary data collection or tracking
- Minimal logging, only when absolutely necessary for debugging
- No third-party analytics or tracking scripts
- Local font serving and asset management

### 2. Accessibility-First Approach
- WCAG 2.1 Level AA compliance as minimum requirement
- Semantic HTML structure
- Proper ARIA attributes and roles
- Keyboard navigation support
- Screen reader optimization
- Color contrast requirements
- Focus management during loading states
- Progressive enhancement

### 3. Local-First Architecture
- Minimize external dependencies
- Local data processing and storage where possible
- Offline-first capabilities where feasible
- Local caching strategies
- Local font and asset management
- Reduced server roundtrips

### 4. Performance and Resource Efficiency
- Minimal bundle sizes
- Efficient caching strategies
- Optimized asset loading
- Reduced network requests
- Memory-efficient data handling
- Battery-friendly operations

## Request for Comments (Backend Team)

Dear Backend Team,

We would appreciate your feedback on the following key aspects of our deployment strategy:

1. **API Integration**
   - Are our proposed environment configurations aligned with your backend setup?
   - Do you see any potential issues with the proxy configuration in development?
   - Are there specific headers or CORS requirements we should be aware of?

2. **Security Measures**
   - Is our CSP configuration compatible with your API responses?
   - Are there additional security headers we should implement?
   - Do you have specific requirements for rate limiting that we should align with?

3. **Local-First Approach**
   - Can we implement more endpoints that support local data processing?
   - Are there opportunities to reduce server load by processing more data client-side?
   - How can we optimize our API calls to support offline-first functionality?

4. **Monitoring Strategy**
   - What specific metrics would be valuable for you to receive from the frontend?
   - How should we coordinate error tracking between frontend and backend?
   - Are there specific logging formats that would integrate better with your systems?

5. **Deployment Coordination**
   - How do you envision the coordination of frontend/backend deployments?
   - What are your thoughts on our proposed blue-green deployment strategy?
   - Are there specific requirements for health checks or service discovery?

Please pay special attention to our core design principles of privacy-first, accessibility-first, and local-first development. We want to ensure our deployment strategy aligns with these principles while maintaining efficient integration with the backend services.

Looking forward to your feedback and suggestions.

Best regards,
Frontend Team 

## Backend CI/CD Requirements

### 1. Local Development Pipeline
```yaml
name: Backend Development Pipeline

on:
  push:
    paths:
      - 'backend/**'
    branches:
      - develop
      - feature/**
  pull_request:
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
          
      - name: Install Poetry
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          
      - name: Install dependencies
        run: |
          cd backend
          poetry install
          
      - name: Run tests
        run: |
          cd backend
          poetry run pytest tests/ --cov=app --cov-report=xml
          
      - name: Run linting
        run: |
          cd backend
          poetry run black . --check
          poetry run isort . --check
          poetry run flake8 .
          
      - name: Type checking
        run: |
          cd backend
          poetry run mypy app/

  performance:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Run performance tests
        run: |
          cd backend
          poetry run pytest tests/performance/ --benchmark-only
```

### 2. Backend Deployment Requirements

#### Environment Configuration
```bash
# Required environment variables
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
DATABASE_URL=sqlite:///./app.db
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
```

#### Database Migration Strategy
```python
# alembic/env.py
def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()
```

#### Health Check Implementation
```python
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment verification."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": await check_database_connection(),
        "cache": await check_redis_connection()
    }
```

### 3. Performance Monitoring

#### Metrics Collection
```python
from prometheus_client import Counter, Histogram

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)
```

#### Logging Configuration
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(levelname)s %(name)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json'
        }
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO'
    }
}
```

### 4. Security Measures

#### Security Headers
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

#### Rate Limiting
```python
from fastapi import HTTPException
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1"]
)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    if await is_rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    return await call_next(request)
```

### 5. Deployment Verification

#### Pre-deployment Checks
```bash
#!/bin/bash
# pre-deploy.sh

# Check Python version
python --version

# Verify dependencies
poetry check

# Run tests
poetry run pytest

# Check migrations
poetry run alembic check

# Verify environment variables
./scripts/check-env.sh

# Check security headers
./scripts/check-security.sh
```

#### Post-deployment Checks
```bash
#!/bin/bash
# post-deploy.sh

# Verify API health
curl http://localhost:8000/health

# Check database connectivity
./scripts/check-db.sh

# Verify Redis connection
./scripts/check-redis.sh

# Run smoke tests
poetry run pytest tests/smoke/
```

### 6. Rollback Strategy

#### Database Rollback
```python
# alembic/versions/rollback.py
def downgrade():
    """Rollback database changes."""
    op.execute("""
        -- Rollback SQL statements
        DROP INDEX IF EXISTS idx_sessions_user_date;
        DROP INDEX IF EXISTS idx_progress_user_activity;
    """)
```

#### Application Rollback
```bash
#!/bin/bash
# rollback.sh

# Stop current version
supervisorctl stop langportal

# Restore previous version
cp -r /opt/backup/langportal-$(date +%Y%m%d) /opt/langportal

# Start previous version
supervisorctl start langportal

# Verify health
./scripts/health-check.sh
```

### 7. Monitoring Strategy

#### Application Metrics
```python
from prometheus_client import Gauge

ACTIVE_USERS = Gauge(
    'active_users_total',
    'Number of active users'
)

CACHE_HIT_RATIO = Gauge(
    'cache_hit_ratio',
    'Cache hit ratio'
)

DB_CONNECTION_POOL = Gauge(
    'db_connection_pool_size',
    'Database connection pool size'
)
```

#### Performance Alerts
```python
async def check_performance_metrics():
    """Monitor performance metrics and trigger alerts."""
    response_time = await get_average_response_time()
    if response_time > 1000:  # 1 second
        await send_alert(
            "High Response Time",
            f"Average response time: {response_time}ms"
        )
```

