import logging
import os
from logging.handlers import RotatingFileHandler
from .config import settings

class ExtraFieldsFormatter(logging.Formatter):
    """Custom formatter that includes extra fields in the log message."""
    def format(self, record):
        """Format log record with extra fields."""
        # Format the basic message
        message = super().format(record)
        
        # Add extra fields if they exist
        if hasattr(record, 'extra'):
            extra_str = ' '.join(f'{k}={v}' for k, v in record.extra.items())
            message = f"{message} - {extra_str}"
            
        return message

def setup_logging():
    """Configure logging with file and console handlers."""
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(settings.BACKEND_DIR, 'logs')
    os.makedirs(log_dir, exist_ok=True)

    # Create formatter
    formatter = ExtraFieldsFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Set to DEBUG to allow all levels

    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Create file handler for error logs
    error_log = os.path.join(log_dir, 'error.log')
    os.makedirs(os.path.dirname(error_log), exist_ok=True)
    error_handler = RotatingFileHandler(
        error_log,
        maxBytes=10485760,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)

    # Create file handler for info logs
    info_log = os.path.join(log_dir, 'info.log')
    os.makedirs(os.path.dirname(info_log), exist_ok=True)
    info_handler = RotatingFileHandler(
        info_log,
        maxBytes=10485760,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    info_handler.setLevel(logging.INFO)
    info_handler.setFormatter(formatter)
    root_logger.addHandler(info_handler)

    # Create debug file handler
    debug_log = os.path.join(log_dir, 'debug.log')
    os.makedirs(os.path.dirname(debug_log), exist_ok=True)
    debug_handler = RotatingFileHandler(
        debug_log,
        maxBytes=10485760,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    debug_handler.setLevel(logging.DEBUG)
    debug_handler.setFormatter(formatter)
    root_logger.addHandler(debug_handler)

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    return root_logger

def log_with_extra(logger, level, message, extra=None):
    """Helper function to log messages with extra fields."""
    if extra is None:
        logger.log(level, message)
    else:
        logger.log(level, message, extra={'extra': extra})

# Initialize logging
logger = setup_logging()

# Monkey patch the logger's info method to handle extra fields
_original_info = logger.info
def _info_with_extra(msg, *args, **kwargs):
    extra = kwargs.pop('extra', None)
    if extra:
        kwargs['extra'] = {'extra': extra}
    return _original_info(msg, *args, **kwargs)
logger.info = _info_with_extra