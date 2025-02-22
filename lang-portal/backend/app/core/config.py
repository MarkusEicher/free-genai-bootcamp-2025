from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Language Learning Portal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Backend directory configuration
    BACKEND_DIR: Path = Path(__file__).parent.parent.parent
    
    # Development mode
    DEV_MODE: bool = True
    
    # Database URLs with explicit paths in backend directory
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR}/data/app.db"
    TEST_DATABASE_URL: str = f"sqlite:///{BACKEND_DIR}/data/test.db"
    
    # Database configuration
    DB_ECHO: bool = False  # SQL query logging
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    
    # Test configuration
    TEST_DB_ECHO: bool = False  # Disable SQL logging in tests
    KEEP_TEST_DB: bool = False  # Don't keep test DB by default
    
    class Config:
        case_sensitive = True

settings = Settings()
