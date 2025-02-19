#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Set development mode
export DEV_MODE=true

echo -e "${GREEN}Starting Language Learning Portal API in Development Mode${NC}"
echo -e "${YELLOW}Development Features:${NC}"
echo "- Interactive API documentation at http://localhost:8000/docs"
echo "- Swagger UI for testing endpoints"
echo "- Auto-reload on code changes"
echo "- Detailed error messages"
echo "- Local-only access"

echo -e "\n${YELLOW}Security Notice:${NC}"
echo "- Documentation is only accessible locally"
echo "- No data collection or tracking"
echo "- All security headers are still enforced"
echo "- External access to docs is blocked"

# Create necessary directories
echo -e "\n${GREEN}Setting up development environment...${NC}"
mkdir -p data/cache
mkdir -p logs

# Check Python environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies if needed
if [ ! -f ".venv/lib/python*/site-packages/fastapi" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

echo -e "\n${GREEN}Starting development server...${NC}"
echo "Press Ctrl+C to stop the server"
echo -e "${YELLOW}Note: This script is for development only. Use start.sh for production.${NC}\n"

# Start the application with auto-reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 