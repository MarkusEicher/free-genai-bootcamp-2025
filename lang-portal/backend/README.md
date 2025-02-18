# Backend Implementation Documentation for the Language Learning Portal Application

> This repository contains the ***BACKEND*** implementation for the language learning portal.You can find the complete documentation for the project in the /lang-portal-docs folder. This README is a quick start guide to help you get the ***BACKEND*** up and running. For more detailed documentation, please refer to the (lang-portal/docs folder).The documents that are named starting with BACKEND- are the ones that are related to the BACKEND implementation.


## Prerequisites

- Python ">=3.12,<4.0"
- Poetry (for dependency management)
- Redis (for caching)

## Installation

### Development Setup (Recommended)
1. Install Poetry globally:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows
# Download from https://redis.io/download
```

3. Install dependencies:
```bash
cd backend
poetry install
```

### Alternative Setup (using pip)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt  # For production
# OR
pip install -r requirements-dev.txt  # For development
```

## Development
- Use Poetry for dependency management
- Run `poetry add package-name` to add new dependencies
- Run `poetry update` to update dependencies

## Running the Application
1. Start Redis server:
```bash
# Linux/macOS
redis-server

# Windows
redis-server.exe
```

2. Start the application:
```bash
# Development mode
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Testing
```bash
# Run all tests
pytest

# Run tests with coverage report
pytest --cov=app tests/

# Run specific tests with coverage
pytest tests/api/test_dashboard.py --cov=app.api.v1.endpoints.dashboard --cov=app.services.dashboard --cov-report=term-missing
```

## Project Structure
```
backend/
├── app/                  # Main application package
│   ├── api/             # API endpoints
│   │   └── v1/          # API version 1
│   ├── core/            # Core functionality
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   └── services/        # Business logic
├── tests/               # Tests
├── data/               # SQLite database files (not in version control)
└── logs/               # Log files (not in version control)
```

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```bash
# Database configuration
DATABASE_URL="sqlite:///data/app.db"
TEST_DATABASE_URL="sqlite:///data/test.db"

# Redis configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_DB=0
REDIS_TEST_DB=1
```

## API Documentation
Once the application is running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Contributing
1. Create a new branch for your feature
2. Write tests for your changes
3. Update documentation as needed
4. Submit a pull request

## License
[Add your license information here]
