lang-portal/                          # Root project folder
├── backend/                          # Backend service
│   ├── app/                         # Application source code
│   │   ├── api/                    # API layer
│   │   │   └── v1/                # API version 1
│   │   │       ├── endpoints/     # API endpoint implementations
│   │   │       └── dependencies/  # API dependencies and utilities
│   │   ├── core/                  # Core functionality
│   │   │   ├── auth/             # Authentication & authorization
│   │   │   ├── cache/            # Caching functionality
│   │   │   ├── config/           # Configuration management
│   │   │   ├── errors/           # Error handling
│   │   │   ├── logging/          # Logging configuration
│   │   │   └── security/         # Security utilities
│   │   ├── db/                   # Database layer
│   │   │   ├── migrations/       # Database migration scripts
│   │   │   ├── repositories/     # Database repositories
│   │   │   └── seeders/         # Database seeders
│   │   ├── middleware/           # Middleware components
│   │   │   ├── auth/            # Authentication middleware
│   │   │   ├── cache/           # Cache middleware
│   │   │   ├── logging/         # Logging middleware
│   │   │   └── validation/      # Validation middleware
│   │   ├── models/              # Database models
│   │   │   ├── activity/        # Activity-related models
│   │   │   ├── language/        # Language-related models
│   │   │   ├── progress/        # Progress tracking models
│   │   │   └── vocabulary/      # Vocabulary-related models
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── requests/        # Request schemas
│   │   │   ├── responses/       # Response schemas
│   │   │   └── validators/      # Custom validators
│   │   └── services/            # Business logic services
│   │       ├── activity/        # Activity services
│   │       ├── language/        # Language services
│   │       ├── progress/        # Progress services
│   │       └── vocabulary/      # Vocabulary services
│   ├── data/                    # Application data
│   │   ├── backups/            # Database backups
│   │   └── uploads/            # User uploads
│   ├── logs/                   # Application logs
│   │   ├── access/            # Access logs
│   │   ├── error/             # Error logs
│   │   └── debug/             # Debug logs
│   ├── migrations/            # Alembic migrations
│   │   ├── versions/         # Migration versions
│   │   └── scripts/          # Migration scripts
│   ├── scripts/              # Utility scripts
│   │   ├── backup/          # Backup scripts
│   │   ├── deployment/      # Deployment scripts
│   │   └── maintenance/     # Maintenance scripts
│   ├── test/                # Test files
│   │   ├── api/            # API tests
│   │   │   ├── v1/        # API v1 tests
│   │   │   │   ├── activity/      # Activity endpoint tests
│   │   │   │   ├── dashboard/     # Dashboard endpoint tests
│   │   │   │   ├── language/      # Language endpoint tests
│   │   │   │   ├── progress/      # Progress endpoint tests
│   │   │   │   ├── statistics/    # Statistics endpoint tests
│   │   │   │   └── vocabulary/    # Vocabulary endpoint tests
│   │   │   └── common/     # Common API test utilities
│   │   ├── core/           # Core functionality tests
│   │   │   ├── auth/      # Authentication tests
│   │   │   ├── cache/     # Cache tests
│   │   │   ├── config/    # Configuration tests
│   │   │   └── logging/   # Logging tests
│   │   ├── db/            # Database tests
│   │   │   ├── migrations/  # Migration tests
│   │   │   ├── models/     # Model tests
│   │   │   └── seeders/    # Seeder tests
│   │   ├── integration/    # Integration tests
│   │   │   ├── flows/     # Business flow tests
│   │   │   └── api/       # API integration tests
│   │   ├── services/      # Service tests
│   │   │   ├── activity/  # Activity service tests
│   │   │   ├── language/  # Language service tests
│   │   │   ├── progress/  # Progress service tests
│   │   │   └── vocabulary/ # Vocabulary service tests
│   │   ├── utils/         # Test utilities
│   │   │   ├── fixtures/  # Test fixtures
│   │   │   ├── mocks/     # Mock objects
│   │   │   └── helpers/   # Test helper functions
│   │   └── conftest.py    # Test configuration
│   └── .venv/             # Virtual environment
├── docs/                  # Documentation
│   ├── api/              # API documentation
│   │   ├── v1/          # API v1 documentation
│   │   └── schemas/     # Schema documentation
│   ├── architecture/    # Architecture documentation
│   │   ├── diagrams/   # Architecture diagrams
│   │   └── decisions/  # Architecture decisions
│   ├── deployment/     # Deployment documentation
│   ├── development/    # Development documentation
│   │   ├── setup/     # Setup guides
│   │   └── workflow/  # Development workflow
│   ├── draft/         # Draft documents
│   ├── images/        # Documentation images
│   └── testing/       # Testing documentation
└── frontend/          # Frontend application (future)
```

## Test Organization Principles

1. **Clear Separation of Concerns**
   - Each test type has its own directory
   - Test files mirror the structure of the code they test
   - Common test utilities are centralized

2. **Test Types**
   - Unit tests: Test individual components
   - Integration tests: Test component interactions
   - API tests: Test HTTP endpoints
   - Service tests: Test business logic
   - Database tests: Test data access and models

3. **File Naming Conventions**
   - All test files start with `test_`
   - Use descriptive suffixes:
     - `_test.py` - Unit tests
     - `_integration_test.py` - Integration tests
     - `_e2e_test.py` - End-to-end tests
     - `_api_test.py` - API tests

4. **Test Configuration**
   - Global fixtures in `/test/conftest.py`
   - Module-specific fixtures in respective test directories
   - Shared test data in `/test/utils/fixtures`

5. **Test Utilities**
   - Mock objects in `/test/utils/mocks`
   - Helper functions in `/test/utils/helpers`
   - Common fixtures in `/test/utils/fixtures`

6. **Test Data Management**
   - Test data factories in `/test/utils/factories`
   - Static test data in `/test/utils/data`
   - Database seeders in `/test/db/seeders`

7. **Integration Test Organization**
   - Business flow tests in `/test/integration/flows`
   - API integration tests in `/test/integration/api`
   - Service integration tests in `/test/integration/services`

This structure is designed to:
- Scale with project growth
- Maintain clear organization
- Support easy navigation
- Enable efficient test execution
- Facilitate test maintenance
