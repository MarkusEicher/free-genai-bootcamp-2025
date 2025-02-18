from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Get the backend directory path
    BACKEND_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    # Database URLs with explicit paths in backend directory
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR}/data/app.db"
    TEST_DATABASE_URL: str = f"sqlite:///{BACKEND_DIR}/data/test.db"
    
    # Database configuration
    DB_ECHO: bool = False  # SQL query logging
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # Redis configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_TEST_DB: int = 1  # Separate DB for testing
    
    # Test configuration
    TEST_DB_ECHO: bool = True
    KEEP_TEST_DB: bool = True  # Keep test DB for debugging
    
    class Config:
        env_file = ".env"

settings = Settings()
