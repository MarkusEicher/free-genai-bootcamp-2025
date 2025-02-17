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

## Running the Application
```bash
# Development mode
poetry run uvicorn app.main:app --reload

# Production mode
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Testing
```bash
# Run all tests
poetry run pytest

# Run tests with coverage report
poetry run pytest --cov=app tests/
```

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

## Environment Variables
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your-secret-key
ENVIRONMENT=development
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
