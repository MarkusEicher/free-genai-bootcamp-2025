from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List, Dict, Any
import pytest
from datetime import datetime, UTC
import os
import glob
import json
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db, engine
from app.core.cache import redis_client
from app.db.base_class import Base

router = APIRouter()

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

# Redis inspection endpoints
@router.get("/redis/info")
async def get_redis_info() -> Dict[str, Any]:
    """Get Redis server information."""
    info = redis_client.info()
    return {
        "server_info": {
            "version": info["redis_version"],
            "uptime_days": info["uptime_in_days"],
            "connected_clients": info["connected_clients"]
        },
        "memory": {
            "used_memory_human": info["used_memory_human"],
            "peak_memory_human": info["used_memory_peak_human"],
            "max_memory_human": info.get("maxmemory_human", "unlimited")
        },
        "stats": {
            "total_connections_received": info["total_connections_received"],
            "total_commands_processed": info["total_commands_processed"],
            "instantaneous_ops_per_sec": info["instantaneous_ops_per_sec"],
            "total_keys": redis_client.dbsize()
        }
    }

@router.get("/redis/keys")
async def list_redis_keys(pattern: str = "*") -> Dict[str, Any]:
    """List Redis keys matching a pattern."""
    keys = redis_client.keys(pattern)
    key_info = []
    
    for key in keys[:100]:  # Limit to 100 keys for performance
        try:
            key_type = redis_client.type(key)
            ttl = redis_client.ttl(key)
            
            key_info.append({
                "key": key,
                "type": key_type,
                "ttl": ttl if ttl > -1 else None,
                "size": redis_client.memory_usage(key)
            })
        except Exception as e:
            key_info.append({
                "key": key,
                "error": str(e)
            })
    
    return {
        "total_keys": len(keys),
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