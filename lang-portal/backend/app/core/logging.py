import logging
import os
import re
from logging.handlers import RotatingFileHandler
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
        # Sanitize the message
        record.msg = self._sanitize_value(record.msg)
        
        # Sanitize extra fields
        if hasattr(record, 'extra'):
            if isinstance(record.extra, dict):
                record.extra = self._sanitize_dict(record.extra)
            else:
                record.extra = self._sanitize_value(record.extra)
        
        # Format the message with extra fields
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
                # Overwrite file with zeros
                with open(path, 'wb') as f:
                    f.write(b'0' * os.path.getsize(path))
                # Delete the file
                os.unlink(path)
            except Exception:
                pass
    
    def doRollover(self) -> None:
        """Perform secure log rotation."""
        if self.stream:
            self.stream.close()
            self.stream = None
        
        if self.backupCount > 0:
            # Securely delete the oldest log file
            oldest_backup = f"{self.baseFilename}.{self.backupCount}"
            self._secure_delete(oldest_backup)
            
            # Rotate the other backup files
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

def setup_logging() -> logging.Logger:
    """Configure privacy-focused logging with secure file and console handlers."""
    # Create logs directory if it doesn't exist
    log_dir = Path(settings.BACKEND_DIR) / 'logs'
    log_dir.mkdir(parents=True, exist_ok=True)

    # Create privacy-focused formatter
    formatter = PrivacyFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)  # Default to INFO for privacy

    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create secure file handler for error logs
    error_log = log_dir / 'error.log'
    error_handler = SecureRotatingFileHandler(
        error_log,
        maxBytes=5242880,  # 5MB
        backupCount=3,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)

    # Create secure file handler for info logs
    info_log = log_dir / 'info.log'
    info_handler = SecureRotatingFileHandler(
        info_log,
        maxBytes=5242880,  # 5MB
        backupCount=3,
        encoding='utf-8'
    )
    info_handler.setLevel(logging.INFO)
    info_handler.setFormatter(formatter)
    root_logger.addHandler(info_handler)

    if settings.DEV_MODE:
        # Create debug file handler only in development mode
        debug_log = log_dir / 'debug.log'
        debug_handler = SecureRotatingFileHandler(
            debug_log,
            maxBytes=5242880,  # 5MB
            backupCount=2,
            encoding='utf-8'
        )
        debug_handler.setLevel(logging.DEBUG)
        debug_handler.setFormatter(formatter)
        root_logger.addHandler(debug_handler)

        # Create console handler for development
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    else:
        # Minimal console output in production
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    return root_logger

def log_with_extra(logger: logging.Logger, level: int, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
    """Helper function to log messages with extra fields, ensuring privacy."""
    if extra is None:
        logger.log(level, message)
    else:
        logger.log(level, message, extra={'extra': extra})

# Initialize logging
logger = setup_logging()

# Monkey patch the logger's info method to handle extra fields
_original_info = logger.info
def _info_with_extra(msg: str, *args: Any, **kwargs: Any) -> None:
    extra = kwargs.pop('extra', None)
    if extra:
        kwargs['extra'] = {'extra': extra}
    return _original_info(msg, *args, **kwargs)
logger.info = _info_with_extra