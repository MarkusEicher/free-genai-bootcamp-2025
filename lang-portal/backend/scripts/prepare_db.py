#!/usr/bin/env python
import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, inspect

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.core.config import settings
from alembic.config import Config
from alembic import command
from app.db.database import Base

def verify_database(url: str) -> bool:
    """Verify database tables are properly created"""
    engine = create_engine(url)
    inspector = inspect(engine)
    
    expected_tables = {
        'languages',
        'language_pairs',
        'vocabulary_groups',
        'vocabularies',
        'vocabulary_group_association',
        'vocabulary_progress'
    }
    
    actual_tables = set(inspector.get_table_names())
    return expected_tables.issubset(actual_tables)

def prepare_databases():
    """Prepare both production and test databases"""
    # Production database
    print("Preparing production database...")
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    
    if verify_database(settings.DATABASE_URL):
        print("Production database setup successful")
    else:
        print("Warning: Production database may not be properly configured")
    
    # Test database
    print("\nPreparing test database...")
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.TEST_DATABASE_URL)
    command.upgrade(alembic_cfg, "head")
    
    if verify_database(settings.TEST_DATABASE_URL):
        print("Test database setup successful")
    else:
        print("Warning: Test database may not be properly configured")

if __name__ == "__main__":
    prepare_databases()