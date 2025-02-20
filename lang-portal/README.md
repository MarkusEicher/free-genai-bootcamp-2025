# Language Learning Portal

## Project Overview
A single-user language learning application with vocabulary management, learning activities, and progress tracking.

## Project Structure
```
/lang-portal/
├── backend/      # FastAPI backend application
├── frontend/     # React frontend application
└── docs/         # Project documentation
```

## Technology Stack
- Backend: Python/FastAPI with SQLite
- Frontend: React/Vite with TypeScript
- Documentation: Markdown/OpenAPI

## Getting Started

### Prerequisites

> ## IMPORTANT: 

> ## Make sure you have Rust installed.

>Because of the way we use the Python dependency manager poetry, we need the system that is running the backend locally to have Rust installed and cargo needs to be present in the PATH of the terminal were you start the backend server. We are working to fix this asap.

- Python 3.8+
- Node.js 18+
- Git
- Cargo

### Development Setup
1. Clone the repository
2. Setup backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   ```
3. Setup frontend:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application
1. Start backend:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Documentation
- API Documentation: Available at `/docs/api`
- Frontend Documentation: Available at `/docs/frontend`
- Backend Documentation: Available at `/docs/backend`

## Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript/TypeScript
- Write tests for new features
- Update documentation as needed

## Project Status
In development 