from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"
    
    # Database configuration
    DB_ECHO: bool = False  # SQL query logging
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # Test configuration
    TEST_DB_ECHO: bool = True
    KEEP_TEST_DB: bool = False  # Whether to keep test DB after tests
    
    class Config:
        env_file = ".env"

settings = Settings()
