"""Centralized logging configuration for the backend."""
import os
import logging
import re
from logging.handlers import RotatingFileHandler
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
from .config import settings

class PrivacyFormatter(logging.Formatter):
    """Custom formatter that sanitizes sensitive information."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.sensitive_patterns = [
            (r'\b\d{3,}\b', '[ID]'),  # Numeric IDs
            (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]'),  # Email addresses
            (r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '[IP]'),  # IP addresses
            (r'\b([0-9A-Fa-f]{8}[-]?[0-9A-Fa-f]{4}[-]?[0-9A-Fa-f]{4}[-]?[0-9A-Fa-f]{4}[-]?[0-9A-Fa-f]{12})\b', '[UUID]'),  # UUIDs
            (r'token[=:]\s*[^\s&]+', 'token=[REDACTED]'),  # API tokens
            (r'password[=:]\s*[^\s&]+', 'password=[REDACTED]'),  # Passwords
            (r'secret[=:]\s*[^\s&]+', 'secret=[REDACTED]'),  # Secrets
            (r'key[=:]\s*[^\s&]+', 'key=[REDACTED]'),  # Keys
            (r'session[=:]\s*[^\s&]+', 'session=[REDACTED]'),  # Session IDs
            (r'auth[=:]\s*[^\s&]+', 'auth=[REDACTED]'),  # Auth tokens
            (r'\b(user|account|profile)-\d+\b', '[USER-ID]'),  # User identifiers
        ]
    
    def _sanitize_value(self, value: Any) -> str:
        """Sanitize a single value."""
        if value is None:
            return 'None'
        
        value_str = str(value)
        for pattern, replacement in self.sensitive_patterns:
            value_str = re.sub(pattern, replacement, value_str)
        return value_str
    
    def _sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively sanitize dictionary values."""
        sanitized = {}
        sensitive_keys = {'password', 'token', 'secret', 'key', 'auth', 'session'}
        
        for key, value in data.items():
            if key.lower() in sensitive_keys:
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, (list, tuple, set)):
                sanitized[key] = [self._sanitize_value(v) for v in value]
            else:
                sanitized[key] = self._sanitize_value(value)
        return sanitized
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with sanitized information."""
        record.msg = self._sanitize_value(record.msg)
        
        if hasattr(record, 'extra'):
            if isinstance(record.extra, dict):
                record.extra = self._sanitize_dict(record.extra)
            else:
                record.extra = self._sanitize_value(record.extra)
        
        message = super().format(record)
        
        if hasattr(record, 'extra'):
            if isinstance(record.extra, dict):
                extra_str = ' '.join(f'{k}={v}' for k, v in record.extra.items())
                message = f"{message} - {extra_str}"
            else:
                message = f"{message} - {record.extra}"
        
        return message

class SecureRotatingFileHandler(RotatingFileHandler):
    """Secure rotating file handler with privacy features."""
    
    def _secure_delete(self, path: str) -> None:
        """Securely delete a file by overwriting with zeros."""
        if os.path.exists(path):
            try:
                with open(path, 'wb') as f:
                    f.write(b'0' * os.path.getsize(path))
                os.unlink(path)
            except Exception:
                pass
    
    def doRollover(self) -> None:
        """Perform secure log rotation."""
        if self.stream:
            self.stream.close()
            self.stream = None
        
        if self.backupCount > 0:
            oldest_backup = f"{self.baseFilename}.{self.backupCount}"
            self._secure_delete(oldest_backup)
            
            for i in range(self.backupCount - 1, 0, -1):
                sfn = f"{self.baseFilename}.{i}"
                dfn = f"{self.baseFilename}.{i + 1}"
                if os.path.exists(sfn):
                    if os.path.exists(dfn):
                        self._secure_delete(dfn)
                    os.rename(sfn, dfn)
        
        dfn = self.baseFilename + ".1"
        if os.path.exists(dfn):
            self._secure_delete(dfn)
        if os.path.exists(self.baseFilename):
            os.rename(self.baseFilename, dfn)
        
        if not self.delay:
            self.stream = self._open()

def setup_logger(name: str, log_file: str, level=logging.INFO, max_size=10*1024*1024, backup_count=5):
    """Set up a logger with privacy-focused file and console handlers."""
    # Create logs directory if it doesn't exist
    log_dir = Path(settings.BACKEND_DIR) / 'logs'
    log_dir.mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Create privacy-focused formatter
    formatter = PrivacyFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Create secure file handler
    file_handler = SecureRotatingFileHandler(
        log_dir / log_file,
        maxBytes=max_size,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger

# Create specific loggers with privacy features
api_logger = setup_logger('api', 'api.log')
db_logger = setup_logger('db', 'database.log')
cache_logger = setup_logger('cache', 'cache.log')
auth_logger = setup_logger('auth', 'auth.log')
metrics_logger = setup_logger('metrics', 'metrics.log')
frontend_logger = setup_logger('frontend', 'frontend.log')

# Performance logger with larger size limit
perf_logger = setup_logger(
    'performance',
    'performance.log',
    level=logging.INFO,
    max_size=20*1024*1024  # 20MB for performance logs
)

def log_api_request(request, response_time: float, status_code: int):
    """Log API request details with privacy protection."""
    api_logger.info(
        f"Request: {request.method} {request.url.path} - "
        f"Status: {status_code} - "
        f"Time: {response_time:.2f}ms - "
        f"Client: {request.client.host}"
    )

def log_performance_metric(
    component: str,
    operation: str,
    duration: float,
    success: bool,
    details: dict = None
):
    """Log performance metrics with privacy protection."""
    perf_logger.info(
        f"Performance - Component: {component} - "
        f"Operation: {operation} - "
        f"Duration: {duration:.2f}ms - "
        f"Success: {success} - "
        f"Details: {details or {}}"
    )

def log_error(logger_name: str, error: Exception, context: dict = None):
    """Log error with context and privacy protection."""
    logger = logging.getLogger(logger_name)
    logger.error(
        f"Error: {str(error)} - "
        f"Type: {type(error).__name__} - "
        f"Context: {context or {}} - "
        f"Timestamp: {datetime.utcnow().isoformat()}"
    )