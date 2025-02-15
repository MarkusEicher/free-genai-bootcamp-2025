from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Language Learning Portal"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Frontend development server
        "http://localhost:3000"   # Alternative frontend port
    ]
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./sql_app.db"  # Default SQLite database
    )
    
    TEST_DATABASE_URL: str = "sqlite:///./test.db"

settings = Settings()
