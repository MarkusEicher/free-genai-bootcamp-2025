# HOMEWORK-WEEK1 - Backend Documentation and deviations from the original business requirements.

## Overview

>The backend implementation deviates from the original business requirements. We chose to use Python-based microservices architecture. This document outlines the actual implementation and its divergence from the initial specifications.

## Implementation Deviations

### Architectural Changes
- **Framework**: Using FastAPI instead of Node.js/Express
  - Provides automatic OpenAPI documentation
  - Better type safety through Python type hints
  - Higher performance through async support
  - More structured dependency injection

- **Database Access**: 
  - Using SQLAlchemy ORM instead of direct SQL
  - Added Alembic for database migrations
  - Maintained SQLite3 as per requirements

- **Additional Components**:
  - Redis caching layer for performance optimization
  - Pydantic for data validation and settings management
  - Comprehensive testing with pytest
  - Poetry for dependency management

### Directory Structure
Current structure differs from requirements:
```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   └── services/
├── tests/
├── migrations/
└── scripts/
```

### Enhanced Database Schema
Extended the original schema with:
- Activity and Session models
- More sophisticated progress tracking
- Better relationship modeling through SQLAlchemy
- Additional indexes for performance

## Core Components

### Models
- Languages and Language Pairs
- Vocabulary and Groups
- Activities and Sessions
- Progress Tracking
- Redis Cache Integration

### API Structure
All endpoints follow RESTful principles and return JSON:

#### Dashboard
- GET `/api/v1/dashboard/stats` - Get overall dashboard statistics
- GET `/api/v1/dashboard/progress` - Get learning progress statistics
- GET `/api/v1/dashboard/latest-sessions` - Get recent study sessions
  - Optional query param: `limit` (default: 5, max: 20)

#### Activities
- GET `/api/v1/activities` - List all activities
  - Query params: `skip`, `limit`, `type`
- POST `/api/v1/activities` - Create new activity
- GET `/api/v1/activities/{activity_id}` - Get activity details
- PUT `/api/v1/activities/{activity_id}` - Update activity
- DELETE `/api/v1/activities/{activity_id}` - Delete activity
- POST `/api/v1/activities/{activity_id}/sessions` - Create new session
- GET `/api/v1/activities/{activity_id}/sessions` - List activity sessions
- POST `/api/v1/sessions/{session_id}/attempts` - Record attempt
- GET `/api/v1/activities/{activity_id}/progress` - Get activity progress

#### Languages
- GET `/api/v1/languages` - List all languages
- POST `/api/v1/languages` - Create new language
- GET `/api/v1/languages/{language_id}` - Get language details
- PUT `/api/v1/languages/{language_id}` - Update language
- DELETE `/api/v1/languages/{language_id}` - Delete language
- GET `/api/v1/languages/search` - Search languages

#### Language Pairs
- GET `/api/v1/language-pairs` - List all language pairs
- POST `/api/v1/language-pairs` - Create new language pair
- GET `/api/v1/language-pairs/{pair_id}` - Get pair details
- PUT `/api/v1/language-pairs/{pair_id}` - Update pair
- DELETE `/api/v1/language-pairs/{pair_id}` - Delete pair

#### Vocabulary
- GET `/api/v1/vocabularies` - List vocabularies
  - Query params: `page`, `size`, `search`, `language_pair_id`
- POST `/api/v1/vocabularies` - Create vocabulary
- GET `/api/v1/vocabularies/{vocabulary_id}` - Get vocabulary details
- PUT `/api/v1/vocabularies/{vocabulary_id}` - Update vocabulary
- DELETE `/api/v1/vocabularies/{vocabulary_id}` - Delete vocabulary
- POST `/api/v1/vocabularies/bulk` - Bulk create vocabularies
- DELETE `/api/v1/vocabularies/bulk` - Bulk delete vocabularies

#### Vocabulary Groups
- GET `/api/v1/vocabulary-groups` - List all groups
- POST `/api/v1/vocabulary-groups` - Create new group
- GET `/api/v1/vocabulary-groups/{group_id}` - Get group details
- PUT `/api/v1/vocabulary-groups/{group_id}` - Update group
- DELETE `/api/v1/vocabulary-groups/{group_id}` - Delete group
- POST `/api/v1/vocabulary-groups/{group_id}/vocabularies` - Add vocabularies to group
- DELETE `/api/v1/vocabulary-groups/{group_id}/vocabularies/{vocabulary_id}` - Remove vocabulary from group

#### Progress Tracking
- GET `/api/v1/progress/vocabulary/{vocabulary_id}` - Get vocabulary progress
- GET `/api/v1/progress/group/{group_id}` - Get group progress
- GET `/api/v1/progress/activity/{activity_id}` - Get activity progress
- POST `/api/v1/progress/reset` - Reset progress data

#### Admin
- GET `/api/v1/admin/test-summary` - Get test coverage summary
- POST `/api/v1/admin/run-tests` - Run test suite
- GET `/api/v1/admin/test-endpoints` - List available test endpoints
- GET `/api/v1/admin/db/tables` - List database tables and structure
- GET `/api/v1/admin/db/models` - List SQLAlchemy models
- GET `/api/v1/admin/redis/info` - Get Redis server information
- GET `/api/v1/admin/redis/keys` - List Redis keys
- GET `/api/v1/admin/logs` - View application logs

#### Health Checks
- GET `/health` - Basic health check
- GET `/health/detailed` - Detailed system health
- GET `/health/database` - Database health status
- GET `/health/cache` - Cache health status
- GET `/health/metrics` - System metrics
- GET `/health/dependencies` - Component dependencies status

## Development Guidelines

### Environment Setup
Required components:
- Python 3.12+
- Redis server
- Poetry for dependency management

### Running the Application
```bash
# Install dependencies
poetry install

# Start Redis
redis-server

# Run the application
uvicorn app.main:app --reload
```

### Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## Performance Considerations

### Caching
- Dashboard data cached for 5 minutes
- Vocabulary lists cached with LRU strategy
- Session results cached for quick access

### Database Optimization
- Proper indexing on frequently queried fields
- Efficient relationship loading
- Query optimization through SQLAlchemy

## Security Notes
While authentication was not required, the implementation includes:
- Rate limiting preparation
- CORS configuration
- Input validation through Pydantic
- SQL injection prevention through ORM

## Future Considerations
Areas where the implementation exceeds original requirements but provides future benefits:
1. Microservices readiness
2. Scalable caching infrastructure
3. Comprehensive testing framework
4. Migration support
5. Type safety throughout the codebase
