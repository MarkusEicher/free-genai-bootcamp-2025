#!/bin/bash

# Configuration
BACKEND_PORT=8002
NGINX_CONFIG="./nginx.conf"
FRONTEND_DIR="../frontend"
BACKEND_DIR="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}Language Learning Portal - Production Startup${NC}"
echo -e "${YELLOW}Security Mode: Production${NC}"
echo "- API documentation disabled"
echo "- Local-only access enforced"
echo "- Maximum security headers"
echo "- No data collection or tracking"

# Check requirements
echo -e "\n${GREEN}Checking requirements...${NC}"

if ! command_exists nginx; then
    echo -e "${RED}Error: nginx is not installed${NC}"
    exit 1
fi

if ! command_exists python3; then
    echo -e "${RED}Error: python3 is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Create necessary directories
echo -e "\n${GREEN}Setting up production environment...${NC}"
mkdir -p data/cache
mkdir -p logs

# Build frontend
echo -e "\n${GREEN}Building frontend...${NC}"
cd "$FRONTEND_DIR" || exit 1
npm install
npm run build

# Start backend
echo -e "\n${GREEN}Starting backend server...${NC}"
cd "$BACKEND_DIR" || exit 1

# Ensure DEV_MODE is false
export DEV_MODE=false

# Set up Python environment
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start nginx
echo -e "\n${GREEN}Starting nginx...${NC}"
nginx -c "$NGINX_CONFIG"

echo -e "\n${GREEN}Production environment is running:${NC}"
echo "Frontend: http://localhost:8000"
echo "Backend API: http://localhost:8000/api"
echo -e "${YELLOW}Note: API documentation is disabled in production mode${NC}"
echo -e "${YELLOW}Use ./start-dev.sh for development with API documentation${NC}"

# Trap SIGINT and SIGTERM
cleanup() {
    echo -e "\n${GREEN}Shutting down production environment...${NC}"
    kill $BACKEND_PID
    nginx -s stop
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait 