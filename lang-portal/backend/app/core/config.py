from pydantic import BaseModel
from typing import Optional
import os

class Settings(BaseModel):
    # Get the backend directory path
    BACKEND_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Development mode
    DEV_MODE: bool = os.getenv("DEV_MODE", "false").lower() == "true"
    
    # Database URLs with explicit paths in backend directory
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR}/data/app.db"
    TEST_DATABASE_URL: str = f"sqlite:///{BACKEND_DIR}/data/test.db"
    
    # Database configuration
    DB_ECHO: bool = False  # SQL query logging
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # Cache configuration
    CACHE_DIR: str = os.path.join(BACKEND_DIR, "data", "cache")
    CACHE_DEFAULT_EXPIRE: int = 300  # 5 minutes
    MAX_CACHE_SIZE: int = 50 * 1024 * 1024  # 50MB
    MAX_ENTRY_SIZE: int = 1 * 1024 * 1024   # 1MB
    CACHE_CLEANUP_THRESHOLD: float = 0.9  # 90% full triggers cleanup
    CACHE_MONITOR_ENABLED: bool = True
    CACHE_METRICS_WINDOW: int = 1000  # Number of response times to keep
    
    # Privacy settings
    COLLECT_METRICS: bool = False
    ENABLE_LOGGING: bool = False
    LOG_LEVEL: str = "ERROR"  # Only log errors by default
    
    # Test configuration
    TEST_DB_ECHO: bool = False  # Disable SQL logging in tests
    KEEP_TEST_DB: bool = False  # Don't keep test DB by default

settings = Settings()
