# Project Structure Documentation

## Overview
The project follows a monorepo structure with clear separation between frontend and backend components, while sharing common documentation.

## Root Structure
```
/lang-portal/
├── backend/      # Backend application
├── frontend/     # Frontend application
└── docs/         # Shared documentation
```

## Backend Structure
```
backend/
├── app/                  # Main application package
│   ├── api/             # API endpoints and route handlers
│   ├── core/            # Core functionality, config, and utilities
│   ├── models/          # SQLAlchemy database models
│   └── schemas/         # Pydantic models for request/response
├── tests/               # Backend tests
└── docs/               # Backend-specific documentation
```

### Backend Directory Purposes
- `app/`: Contains the main application code
  - `api/`: All API endpoints organized by feature
  - `core/`: Configuration, database setup, and shared utilities
  - `models/`: Database models and relationships
  - `schemas/`: Data validation and serialization schemas
- `tests/`: All backend tests, mirroring the app structure
- `docs/`: Technical documentation specific to backend

## Frontend Structure
```
frontend/
├── src/                 # Source code
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components and routes
│   ├── api/            # API client and services
│   └── utils/          # Utility functions and helpers
├── tests/              # Frontend tests
└── docs/              # Frontend-specific documentation
```

### Frontend Directory Purposes
- `src/`: Main source code directory
  - `components/`: Reusable UI components
  - `pages/`: Full page components and routing
  - `api/`: API integration and data fetching
  - `utils/`: Helper functions and utilities
- `tests/`: All frontend tests
- `docs/`: Technical documentation specific to frontend

## Shared Documentation
```
docs/
├── api/                # API documentation and specifications
├── frontend/          # Frontend architecture and guides
└── backend/           # Backend architecture and guides
```

### Documentation Directory Purposes
- `api/`: API specifications, endpoints, and examples
- `frontend/`: Frontend architecture decisions and guides
- `backend/`: Backend architecture decisions and guides

## Key Benefits
1. Clear separation of concerns
2. Easy to locate specific functionality
3. Scalable structure for future growth
4. Consistent organization across frontend and backend
5. Centralized documentation
