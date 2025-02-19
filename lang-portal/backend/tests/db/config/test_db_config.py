import pytest
from sqlalchemy import create_engine, text, inspect, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from app.core.config import settings
from app.db.database import Base
from app.db.base_class import Base
from app.db.init_db import init_db
import os

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
            'vocabulary_progress',
            'activities',
            'sessions',
            'session_attempts',
            'activity_vocabulary'
        ]
        
        for table in expected_tables:
            assert table in tables, f"Table {table} is missing"
            
    finally:
        Base.metadata.drop_all(bind=engine)

def test_init_db_creates_data_directory():
    """Test that init_db creates the data directory if it doesn't exist"""
    data_dir = os.path.join(settings.BACKEND_DIR, 'data')
    
    # Remove data directory if it exists
    if os.path.exists(data_dir):
        os.rmdir(data_dir)
    
    # Initialize database
    engine = init_db()
    
    try:
        # Verify data directory was created
        assert os.path.exists(data_dir)
        assert os.path.isdir(data_dir)
    finally:
        Base.metadata.drop_all(bind=engine)

def test_init_db_with_existing_tables():
    """Test initializing database when tables already exist"""
    # Create database first time
    engine1 = init_db()
    
    try:
        # Create some test data
        inspector = inspect(engine1)
        tables1 = set(inspector.get_table_names())
        
        # Initialize again
        engine2 = init_db()
        
        # Verify tables were recreated
        inspector = inspect(engine2)
        tables2 = set(inspector.get_table_names())
        
        assert tables1 == tables2
    finally:
        Base.metadata.drop_all(bind=engine1)

def test_init_db_foreign_key_support():
    """Test that foreign key support is enabled"""
    engine = init_db()
    
    try:
        # Create a connection and check PRAGMA foreign_keys
        with engine.connect() as conn:
            result = conn.execute("PRAGMA foreign_keys").fetchone()
            assert result[0] == 1, "Foreign key support not enabled"
    finally:
        Base.metadata.drop_all(bind=engine)

def test_init_db_with_invalid_url():
    """Test initialization with invalid database URL"""
    invalid_url = "sqlite:///nonexistent/directory/db.sqlite"
    
    with pytest.raises(OperationalError):
        init_db(invalid_url)

def test_database_constraints():
    """Test that database constraints are properly created"""
    engine = init_db()
    
    try:
        inspector = inspect(engine)
        
        # Check foreign key constraints
        fks = inspector.get_foreign_keys('language_pairs')
        assert any(fk['referred_table'] == 'languages' for fk in fks)
        
        # Check unique constraints
        unique_constraints = inspector.get_unique_constraints('languages')
        assert any(
            'code' in constraint['column_names'] 
            for constraint in unique_constraints
        )
        
        # Check indexes
        indexes = inspector.get_indexes('vocabularies')
        assert any(
            'id' in index['column_names'] 
            for index in indexes
        )
    finally:
        Base.metadata.drop_all(bind=engine)