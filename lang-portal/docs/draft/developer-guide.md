# Language Learning Portal - Developer Guide

## Quick Start

Get the portal running in 5 minutes:

```bash
# 1. Clone and enter the project
git clone <repository-url>
cd lang-portal

# 2. Set up the backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# 3. Start Redis (required for caching)
# On Windows: Start Redis server from the Windows Service
# On Mac/Linux:
redis-server

# 4. Run the application
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` to see the API documentation!

## Project Structure

```
lang-portal/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core functionality
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic models
│   │   └── services/     # Business logic
│   ├── tests/            # Test files
│   └── requirements.txt  # Python dependencies
└── docs/
    ├── user-guide.md     # For users
    └── developer-guide.md # You are here!
```

## Key Components

### 1. Dashboard
The dashboard shows learning statistics:
```python
# app/api/v1/endpoints/dashboard.py
@router.get("/stats")
async def get_dashboard_stats():
    # Returns:
    # - Success rate
    # - Study sessions count
    # - Active activities
    # - Study streak
```

### 2. Activities
Activities are the core learning features:
```python
# app/models/activity.py
class Activity(Base):
    type = Column(String)      # "flashcard", "quiz", "typing"
    name = Column(String)      # "Basic Verbs", "Food Words"
    description = Column(String)
```

### 3. Caching
We use Redis to cache dashboard data:
```python
# app/core/cache.py
@cache_response(prefix="dashboard:stats", expire=300)
async def get_dashboard_stats():
    # Results cached for 5 minutes
```

## Common Development Tasks

### 1. Adding a New API Endpoint

```python
# 1. Create schema in app/schemas/
from pydantic import BaseModel

class NewFeatureSchema(BaseModel):
    name: str
    value: int

# 2. Add endpoint in app/api/v1/endpoints/
@router.post("/new-feature")
def create_new_feature(data: NewFeatureSchema):
    return {"status": "created"}
```

### 2. Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/api/test_dashboard.py

# Run with coverage
pytest --cov=app tests/
```

### 3. Database Changes

```bash
# Create new migration
alembic revision --autogenerate -m "add new table"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Performance Tips

1. **Use Caching**
   ```python
   @cache_response(prefix="my-feature", expire=300)
   async def my_endpoint():
       # Expensive operation here
   ```

2. **Optimize Database Queries**
   ```python
   # Good: Single query
   db.query(Model).filter(Model.id.in_(ids)).all()

   # Bad: Multiple queries
   for id in ids:
       db.query(Model).get(id)
   ```

3. **Background Tasks**
   ```python
   @router.post("/long-task")
   async def start_task(background_tasks: BackgroundTasks):
       background_tasks.add_task(long_running_function)
       return {"status": "processing"}
   ```

## Debugging Guide

### 1. API Issues
Check these when endpoints aren't working:
- Is Redis running? Try `redis-cli ping`
- Database connected? Check `.env` settings
- Correct data in request? Check `/docs`

### 2. Performance Issues
If the app is slow:
1. Check the logs for "Slow request" warnings
2. Look for missing cache hits
3. Monitor database query times

### 3. Test Failures
When tests fail:
1. Check test database is clean
2. Verify Redis is running
3. Look for failed assertions

## Adding New Features

1. **Plan**
   - Write the API endpoint first
   - Design the database schema
   - Plan the caching strategy

2. **Implement**
   ```python
   # 1. Add model
   class NewFeature(Base):
       __tablename__ = "new_features"
       id = Column(Integer, primary_key=True)

   # 2. Create schema
   class NewFeatureSchema(BaseModel):
       name: str

   # 3. Add endpoint
   @router.post("/new-feature")
   def create_new_feature():
       pass

   # 4. Write tests
   def test_new_feature():
       assert True
   ```

3. **Test**
   - Write unit tests
   - Test manually in `/docs`
   - Check performance

## Common Issues & Solutions

### 1. "Redis connection failed"
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Verify settings in .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. "Database errors"
```bash
# Reset database
rm app.db
alembic upgrade head

# Check migrations
alembic current
alembic history
```

### 3. "Tests failing"
```bash
# Clean test environment
rm test.db
pytest --setup-show  # See what's happening

# Debug specific test
pytest tests/test_file.py -k test_name -vv
```

## Best Practices

1. **Code Style**
   ```python
   # Good
   def get_user_score(user_id: int) -> float:
       return calculate_score(user_id)

   # Bad
   def getuserscore(userid):
       return calc_score(userid)
   ```

2. **Error Handling**
   ```python
   # Good
   try:
       result = process_data()
   except ValueError as e:
       raise HTTPException(status_code=400, detail=str(e))

   # Bad
   try:
       result = process_data()
   except:  # Too broad!
       return {"error": "Something went wrong"}
   ```

3. **Documentation**
   ```python
   # Good
   def calculate_streak(sessions: List[Session]) -> int:
       """Calculate user's study streak in days.
       
       Args:
           sessions: List of study sessions ordered by date
           
       Returns:
           Number of consecutive days with sessions
       """
   ```

## Need Help?

- Check the [FastAPI docs](https://fastapi.tiangolo.com/)
- Ask in our Slack channel: #lang-portal-dev
- Create a GitHub issue

Remember: It's okay to ask questions! We were all beginners once. 😊