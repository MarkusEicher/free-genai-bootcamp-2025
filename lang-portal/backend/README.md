# Language Learning Portal - Backend

## Overview
FastAPI backend for the Language Learning Portal.

## Setup
1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run development server:
   ```bash
   uvicorn app.main:app --reload
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
