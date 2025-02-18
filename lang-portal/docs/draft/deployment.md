# Deployment Guide

## Prerequisites

- Python 3.10+
- Redis 6.0+
- SQLite 3.x
- Node.js 18+ (for frontend)
- Docker (optional)

## System Dependencies

Install required system packages:

```bash
# Update package list
sudo apt-get update

# Install system dependencies
sudo apt-get install -y \
    python3-dev \
    python3-pip \
    python3-venv \
    build-essential \
    redis-server \
    redis-tools \
    sqlite3 \
    libsqlite3-dev \
    nginx \
    supervisor

# Verify Redis installation
redis-cli ping  # Should respond with PONG
```

These packages are required for:
- `python3-dev`: Python development headers
- `python3-pip`: Python package installer
- `python3-venv`: Python virtual environment support
- `build-essential`: Required for compiling some Python packages
- `redis-server`: Redis server
- `redis-tools`: Redis CLI tools
- `sqlite3`: SQLite database
- `libsqlite3-dev`: SQLite development headers
- `nginx`: Web server for production deployment
- `supervisor`: Process manager for production deployment

## Dependency Management

The project supports both Poetry and traditional venv-based dependency management:

### Using Poetry (Recommended for Development)

1. Install Poetry:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
cd backend
poetry install  # Installs all dependencies including dev packages
# or
poetry install --only main  # Installs only production dependencies
```

3. Activate the virtual environment:
```bash
poetry shell
```

### Using venv (Alternative)

1. Create and activate virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt  # Production dependencies only
# or
pip install -r requirements-dev.txt  # Including development dependencies
```

### Updating Dependencies

When dependencies are updated in `pyproject.toml`:

1. Update Poetry's lock file:
```bash
poetry update
```

2. Export to requirements files:
```bash
# On Linux/Mac
./export-dep.sh

# On Windows
export-dep.bat
```

This will update both `requirements.txt` and `requirements-dev.txt` with the correct versions and Python constraints.

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd lang-portal
```

2. Create and activate virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Database Setup

1. Initialize the database:
```bash
alembic upgrade head
```

2. (Optional) Load sample data:
```bash
python scripts/seed_data.py
```

## Redis Setup

1. Install Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

2. Start Redis server:
```bash
redis-server
```

3. Verify Redis connection:
```bash
redis-cli ping
# Should respond with PONG
```

## Redis Configuration

After installing Redis, you'll need to configure it properly:

1. Edit the Redis configuration file:
```bash
sudo nano /etc/redis/redis.conf
```

2. Make the following changes:
```conf
# Bind to localhost only (more secure)
bind 127.0.0.1

# Set port (default is fine for most cases)
port 6379

# Enable persistence
appendonly yes

# Set password (recommended for production)
# requirepass your_strong_password
```

3. Start Redis service:
```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server  # Start on boot
```

4. Verify Redis is running:
```bash
redis-cli ping  # Should respond with PONG
```

5. Update environment variables:
```bash
# Add to your .env file
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=your_strong_password  # If you set a password
```

Note: For development environments, the default configuration without a password is acceptable. For production, always set a strong password and consider additional security measures like:
- Disable commands that could be dangerous
- Set memory limits
- Configure maxmemory-policy
- Enable protected mode

## Redis Troubleshooting

Common Redis issues and their solutions:

1. Connection refused:
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Restart Redis if needed
sudo systemctl restart redis-server

# Check Redis logs
sudo journalctl -u redis-server
```

2. Permission issues:
```bash
# Check Redis user permissions
sudo ls -l /var/lib/redis
sudo ls -l /etc/redis

# Fix permissions if needed
sudo chown -R redis:redis /var/lib/redis
sudo chown -R redis:redis /etc/redis
```

3. Memory issues:
```bash
# Check Redis memory usage
redis-cli info memory

# Monitor Redis in real-time
redis-cli monitor

# Clear Redis cache if needed
redis-cli flushall  # Warning: removes all data!
```

4. Performance issues:
```bash
# Check Redis statistics
redis-cli info stats

# Monitor slow operations
redis-cli slowlog get 10
```

5. Authentication issues:
```bash
# Test authentication
redis-cli -a your_password ping

# Reset password if needed (in redis.conf)
# requirepass new_password
```

For more detailed Redis monitoring and debugging, consider using Redis Commander:
```bash
# Install Redis Commander
npm install -g redis-commander

# Run Redis Commander
redis-commander
```

## Redis Performance Tuning

For optimal Redis performance in production:

1. Memory Configuration:
```conf
# In /etc/redis/redis.conf

# Set maximum memory (e.g., 2GB)
maxmemory 2gb

# Set eviction policy
maxmemory-policy allkeys-lru

# Adjust these based on your use case
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
```

2. Persistence Configuration:
```conf
# For better performance with persistence
appendonly yes
appendfsync everysec

# Disable RDB snapshots if using AOF
save ""
```

3. Network Tuning:
```conf
# Increase max clients (default 10000)
maxclients 50000

# Adjust TCP backlog
tcp-backlog 511

# Enable TCP keepalive
tcp-keepalive 300
```

4. System Configuration:
```bash
# Add to /etc/sysctl.conf
vm.overcommit_memory = 1
net.core.somaxconn = 512
```

5. Monitoring Configuration:
```conf
# Enable slowlog for monitoring
slowlog-log-slower-than 10000
slowlog-max-len 128

# Enable latency monitoring
latency-monitor-threshold 100
```

Performance Testing:
```bash
# Install redis-benchmark
sudo apt-get install redis-tools

# Run benchmark
redis-benchmark -q -n 100000

# Test specific commands
redis-benchmark -t set,get -n 100000
```

Recommended Monitoring Tools:
- Redis Commander (GUI)
- RedisInsight (GUI)
- redis-stat (CLI)
- Prometheus with Redis Exporter
- Grafana for visualization

## Application Configuration

### Core Settings

Edit `.env` file with appropriate values:

```env
# Database
DATABASE_URL=sqlite:///./app.db
TEST_DATABASE_URL=sqlite:///./test.db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# API
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Performance Tuning

1. Adjust cache settings in `app/core/cache.py`:
```python
# Default cache expiration times (seconds)
STATS_CACHE_EXPIRE = 300      # 5 minutes
PROGRESS_CACHE_EXPIRE = 300   # 5 minutes
SESSIONS_CACHE_EXPIRE = 60    # 1 minute
```

2. Configure logging in `app/core/logging.py`:
```python
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
```

## Deployment Options

### 1. Direct Deployment

1. Start the application:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

2. Use a process manager (e.g., supervisor):
```ini
[program:langportal]
command=/path/to/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
directory=/path/to/backend
user=www-data
autostart=true
autorestart=true
```

### 2. Docker Deployment

1. Build the image:
```bash
docker build -t langportal-api .
```

2. Run the container:
```bash
docker run -d \
  -p 8000:8000 \
  --name langportal-api \
  -v $(pwd)/data:/app/data \
  langportal-api
```

### 3. Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## Monitoring

1. Application metrics are available at `/metrics`
2. Health check endpoint at `/health`
3. Response times are logged and available in headers (`X-Process-Time-Ms`)

## Backup and Maintenance

1. Database backup:
```bash
sqlite3 app.db ".backup 'backup.db'"
```

2. Cache maintenance:
```bash
# Clear all caches
redis-cli FLUSHDB

# Monitor cache usage
redis-cli INFO | grep used_memory
```

## Security Considerations

1. Set secure Redis password:
```bash
# In redis.conf
requirepass your_secure_password

# In .env
REDIS_PASSWORD=your_secure_password
```

2. Configure CORS properly:
```python
ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com"
]
```

3. Rate limiting is enabled by default:
- 100 requests per minute per IP
- Configurable in `app/core/security.py`

## Troubleshooting

1. Check logs:
```bash
tail -f logs/app.log
```

2. Monitor performance:
```bash
# Check slow requests
grep "Slow request" logs/app.log

# Monitor Redis
redis-cli MONITOR
```

3. Common issues:
- Database locked: Check for concurrent connections
- Cache misses: Verify Redis connection
- Slow responses: Check performance logs 