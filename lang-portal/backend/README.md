# Language Learning Portal - Backend

## Prerequisites
- Python >= 3.8.1
- Poetry (for development)

## Installation

### Development Setup (Recommended)
1. Install Poetry globally:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
cd backend
poetry install
poetry shell
```

### Alternative Setup (using pip)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # For production
# OR
pip install -r requirements-dev.txt  # For development
```

## Development
- Use Poetry for dependency management
- Run `poetry add package-name` to add new dependencies
- Run `poetry update` to update dependencies

## Project Structure
```
backend/
├── app/                  # Main application package
│   ├── api/             # API endpoints
│   ├── core/            # Core functionality
│   ├── models/          # Database models
│   └── schemas/         # Pydantic schemas
├── tests/               # Tests
└── docs/               # Documentation
```

## Development Guidelines
- Follow PEP 8
- Write tests for new features
- Update documentation
