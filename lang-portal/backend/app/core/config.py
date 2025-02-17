from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"  # Changed to file-based for debugging
    
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
