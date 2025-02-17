import pytest
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.database import Base

def test_production_db_url():
    """Test production database connection"""
    engine = create_engine(settings.DATABASE_URL)
    try:
        # Try to create tables
        Base.metadata.create_all(bind=engine)
        # Create a session
        TestingSessionLocal = sessionmaker(bind=engine)
        db = TestingSessionLocal()
        # Try a simple query using text()
        result = db.execute(text("SELECT 1"))
        assert result.scalar() == 1
        db.close()
    finally:
        Base.metadata.drop_all(bind=engine)

def test_test_db_url():
    """Test test database connection"""
    engine = create_engine(settings.TEST_DATABASE_URL)
    try:
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(bind=engine)
        db = TestingSessionLocal()
        result = db.execute(text("SELECT 1"))
        assert result.scalar() == 1
        db.close()
    finally:
        Base.metadata.drop_all(bind=engine)

def test_database_tables():
    """Test that all required tables can be created"""
    engine = create_engine(settings.TEST_DATABASE_URL)
    try:
        Base.metadata.create_all(bind=engine)
        # Get list of all tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Verify all expected tables exist
        expected_tables = [
            'languages',
            'language_pairs',
            'vocabulary_groups',
            'vocabularies',
            'vocabulary_group_association',
            'vocabulary_progress'
        ]
        
        for table in expected_tables:
            assert table in tables, f"Table {table} is missing"
            
    finally:
        Base.metadata.drop_all(bind=engine)