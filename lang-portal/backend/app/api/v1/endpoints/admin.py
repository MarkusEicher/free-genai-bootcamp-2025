from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List, Dict, Any
import pytest
from datetime import datetime, UTC
import os
import glob
import json
from sqlalchemy import inspect
from sqlalchemy.orm import Session
from pathlib import Path

from app.core.config import settings
from app.db.database import get_db, engine
from app.core.cache import LocalCache
from app.db.base_class import Base

router = APIRouter()

# Get cache instance
cache = LocalCache.get_instance()

# Test management functions
def count_tests() -> int:
    """Count total number of test files."""
    test_files = glob.glob(os.path.join(settings.BACKEND_DIR, 'tests/**/*test_*.py'), recursive=True)
    return len(test_files)

def read_last_test_results() -> Dict[str, Any]:
    """Read the last test results from a JSON file."""
    results_file = os.path.join(settings.BACKEND_DIR, 'tests', '.last_results.json')
    if not os.path.exists(results_file):
        return {
            "total_coverage": 0,
            "last_run": None,
            "test_count": count_tests(),
            "status": "unknown"
        }
    try:
        with open(results_file, 'r') as f:
            return json.load(f)
    except:
        return {
            "total_coverage": 0,
            "last_run": None,
            "test_count": count_tests(),
            "status": "unknown"
        }

def save_test_results(results: Dict[str, Any]) -> None:
    """Save test results to a JSON file."""
    results_file = os.path.join(settings.BACKEND_DIR, 'tests', '.last_results.json')
    with open(results_file, 'w') as f:
        json.dump(results, f)

# Test endpoints
@router.get("/test-summary")
async def get_test_summary() -> Dict[str, Any]:
    """Get summary of last test run. Does NOT trigger test execution."""
    return read_last_test_results()

@router.post("/run-tests")
async def run_tests(
    background_tasks: BackgroundTasks,
    test_path: str = None
) -> Dict[str, str]:
    """Run tests in background and save results."""
    def run_test_suite():
        args = ['-v', '--cov=app']
        if test_path:
            args.append(test_path)
        
        # Run tests and collect results
        session = pytest.main(args)
        
        # Save results
        results = {
            "total_coverage": 0,  # Would be calculated from coverage data
            "last_run": datetime.now(UTC).isoformat(),
            "test_count": count_tests(),
            "status": "success" if session == pytest.ExitCode.OK else "failed"
        }
        save_test_results(results)
    
    background_tasks.add_task(run_test_suite)
    return {"status": "Tests started in background"}

@router.get("/test-endpoints")
async def list_test_endpoints() -> Dict[str, List[str]]:
    """List all available test files. Does NOT execute tests."""
    test_files = []
    for root, _, files in os.walk(os.path.join(settings.BACKEND_DIR, 'tests')):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                # Convert to relative path
                rel_path = os.path.relpath(os.path.join(root, file), settings.BACKEND_DIR)
                test_files.append(rel_path)
    
    return {
        "test_files": sorted(test_files),
        "categories": [
            "api", "core", "models", "middleware",
            "services", "db", "cache", "performance"
        ]
    }

# Database inspection endpoints
@router.get("/db/tables")
async def list_tables(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """List all database tables and their structure."""
    inspector = inspect(engine)
    tables = {}
    
    for table_name in inspector.get_table_names():
        tables[table_name] = {
            "columns": [
                {
                    "name": col["name"],
                    "type": str(col["type"]),
                    "nullable": col["nullable"],
                    "primary_key": col["primary_key"]
                }
                for col in inspector.get_columns(table_name)
            ],
            "foreign_keys": [
                {
                    "column": fk["constrained_columns"],
                    "references": f"{fk['referred_table']}.{fk['referred_columns']}"
                }
                for fk in inspector.get_foreign_keys(table_name)
            ],
            "row_count": db.execute(f"SELECT COUNT(*) FROM {table_name}").scalar()
        }
    
    return tables

@router.get("/db/models")
async def list_models() -> Dict[str, Any]:
    """List all SQLAlchemy models and their relationships."""
    models = {}
    
    for model in Base.__subclasses__():
        mapper = inspect(model)
        models[model.__name__] = {
            "tablename": model.__tablename__,
            "columns": [column.key for column in mapper.columns],
            "relationships": [
                {
                    "name": rel.key,
                    "type": rel.direction.name,
                    "target": rel.mapper.class_.__name__
                }
                for rel in mapper.relationships
            ]
        }
    
    return models

# Cache inspection endpoints
@router.get("/cache/info")
async def get_cache_info() -> Dict[str, Any]:
    """Get cache information."""
    cache_dir = Path(settings.CACHE_DIR)
    cache_files = list(cache_dir.glob("*.cache"))
    
    total_size = sum(f.stat().st_size for f in cache_files)
    
    return {
        "cache_type": "local_file",
        "cache_dir": str(cache_dir),
        "stats": {
            "total_files": len(cache_files),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        }
    }

@router.get("/cache/keys")
async def list_cache_keys(pattern: str = "*") -> Dict[str, Any]:
    """List cache keys matching a pattern."""
    cache_dir = Path(settings.CACHE_DIR)
    cache_files = list(cache_dir.glob("*.cache"))
    key_info = []
    
    for cache_file in cache_files[:100]:  # Limit to 100 files for performance
        try:
            with cache_file.open("r") as f:
                content = json.load(f)
                key_info.append({
                    "file": cache_file.name,
                    "created_at": content.get("created_at"),
                    "expires_at": content.get("expires_at"),
                    "size_bytes": cache_file.stat().st_size
                })
        except Exception as e:
            key_info.append({
                "file": cache_file.name,
                "error": str(e)
            })
    
    return {
        "total_keys": len(cache_files),
        "displayed_keys": len(key_info),
        "keys": key_info
    }

@router.get("/logs")
async def view_logs(
    level: str = "ERROR",
    lines: int = 100
) -> Dict[str, Any]:
    """
    View application logs with specified level.
    
    Args:
        level: Log level to view (ERROR, INFO, WARNING, DEBUG)
        lines: Number of lines to return (default: 100)
    """
    valid_levels = ["ERROR", "INFO", "WARNING", "DEBUG"]
    if level not in valid_levels:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid log level. Must be one of: {valid_levels}"
        )
    
    log_file = os.path.join(settings.BACKEND_DIR, 'logs', f'{level.lower()}.log')
    if not os.path.exists(log_file):
        return {
            "level": level,
            "lines": [],
            "total_lines": 0
        }
    
    try:
        # Read last N lines from log file
        with open(log_file, 'r') as f:
            # Use a ring buffer to get last N lines efficiently
            ring_buffer = [""] * lines
            current_line = 0
            
            for line in f:
                ring_buffer[current_line % lines] = line.strip()
                current_line += 1
            
            # Rearrange buffer to get lines in correct order
            if current_line < lines:
                log_lines = ring_buffer[:current_line]
            else:
                start = (current_line % lines)
                log_lines = ring_buffer[start:] + ring_buffer[:start]
            
            return {
                "level": level,
                "lines": log_lines,
                "total_lines": current_line
            }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading log file: {str(e)}"
        )