import logging
import os
from logging.handlers import RotatingFileHandler
from .config import settings

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(settings.BACKEND_DIR, 'logs'), exist_ok=True)

# Configure logging
def setup_logging():
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Create file handler for error logs
    error_handler = RotatingFileHandler(
        os.path.join(settings.BACKEND_DIR, 'logs', 'error.log'),
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)

    # Create file handler for info logs
    info_handler = RotatingFileHandler(
        os.path.join(settings.BACKEND_DIR, 'logs', 'info.log'),
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    info_handler.setLevel(logging.INFO)
    info_handler.setFormatter(formatter)

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove any existing handlers
    root_logger.handlers = []

    # Add handlers
    root_logger.addHandler(error_handler)
    root_logger.addHandler(info_handler)
    root_logger.addHandler(console_handler)

    return root_logger

# Initialize logging
logger = setup_logging() 