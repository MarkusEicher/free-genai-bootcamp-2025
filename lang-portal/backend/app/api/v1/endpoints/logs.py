"""Logging endpoints for frontend log collection."""
from fastapi import APIRouter, Depends, Request
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.logging_config import setup_logger

router = APIRouter()

# Set up frontend logger
frontend_logger = setup_logger('frontend', 'frontend.log')

class LogEntry(BaseModel):
    """Frontend log entry model."""
    timestamp: str
    level: str
    component: str
    message: str
    details: Optional[Dict] = None
    error: Optional[Dict] = None

class LogBatch(BaseModel):
    """Batch of frontend logs."""
    logs: List[LogEntry]

@router.post("/logs", summary="Store frontend logs")
async def store_logs(log_batch: LogBatch, request: Request):
    """Store logs from frontend."""
    client_ip = request.client.host
    
    for log in log_batch.logs:
        # Format the log message
        details_str = f" - Details: {log.details}" if log.details else ""
        error_str = f" - Error: {log.error}" if log.error else ""
        
        log_msg = (
            f"[Frontend][{client_ip}] "
            f"{log.component}: {log.message}"
            f"{details_str}{error_str}"
        )
        
        # Log with appropriate level
        if log.level == "ERROR":
            frontend_logger.error(log_msg)
        elif log.level == "WARN":
            frontend_logger.warning(log_msg)
        elif log.level == "INFO":
            frontend_logger.info(log_msg)
        else:
            frontend_logger.debug(log_msg)
    
    return {"status": "success", "message": f"Processed {len(log_batch.logs)} log entries"} 