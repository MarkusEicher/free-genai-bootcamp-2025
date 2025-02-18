import pytest
import logging
import os
from pathlib import Path
from app.core.logging import setup_logging, logger
from app.core.config import settings
import tempfile
import shutil

@pytest.fixture
def temp_log_dir():
    """Create a temporary log directory for testing."""
    temp_dir = tempfile.mkdtemp()
    original_dir = settings.BACKEND_DIR
    
    # Temporarily change log directory
    settings.BACKEND_DIR = temp_dir
    
    yield temp_dir
    
    # Cleanup
    shutil.rmtree(temp_dir)
    settings.BACKEND_DIR = original_dir

def test_log_directory_creation(temp_log_dir):
    """Test that log directory is created if it doesn't exist."""
    log_dir = os.path.join(temp_log_dir, 'logs')
    
    # Directory shouldn't exist yet
    assert not os.path.exists(log_dir)
    
    # Setup logging
    setup_logging()
    
    # Directory should be created
    assert os.path.exists(log_dir)
    assert os.path.isdir(log_dir)

def test_log_file_creation(temp_log_dir):
    """Test that log files are created."""
    setup_logging()
    
    # Log some messages
    logger.error("Test error message")
    logger.info("Test info message")
    
    # Check that files were created
    error_log = os.path.join(temp_log_dir, 'logs', 'error.log')
    info_log = os.path.join(temp_log_dir, 'logs', 'info.log')
    
    assert os.path.exists(error_log)
    assert os.path.exists(info_log)

def test_log_message_format(temp_log_dir):
    """Test log message formatting."""
    setup_logging()
    
    test_message = "Test log message"
    logger.error(test_message)
    
    # Read error log
    error_log = os.path.join(temp_log_dir, 'logs', 'error.log')
    with open(error_log, 'r') as f:
        log_line = f.readline().strip()
    
    # Verify format
    assert test_message in log_line
    assert " - ERROR - " in log_line
    assert " - root - " in log_line

def test_log_level_filtering(temp_log_dir):
    """Test that log levels are properly filtered."""
    setup_logging()
    
    # Log messages at different levels
    logger.debug("Debug message")
    logger.info("Info message")
    logger.warning("Warning message")
    logger.error("Error message")
    
    # Read log files
    error_log = os.path.join(temp_log_dir, 'logs', 'error.log')
    info_log = os.path.join(temp_log_dir, 'logs', 'info.log')
    
    with open(error_log, 'r') as f:
        error_lines = f.readlines()
    with open(info_log, 'r') as f:
        info_lines = f.readlines()
    
    # Debug messages should not appear
    assert not any("Debug message" in line for line in info_lines)
    
    # Error log should only contain error messages
    assert any("Error message" in line for line in error_lines)
    assert not any("Info message" in line for line in error_lines)
    
    # Info log should contain info and higher
    assert any("Info message" in line for line in info_lines)
    assert any("Warning message" in line for line in info_lines)
    assert any("Error message" in line for line in info_lines)

def test_log_rotation(temp_log_dir):
    """Test log file rotation."""
    setup_logging()
    
    # Write enough data to trigger rotation
    large_message = "x" * 1024 * 1024  # 1MB message
    for _ in range(15):  # Should create multiple log files
        logger.error(large_message)
    
    # Check for rotated files
    log_dir = os.path.join(temp_log_dir, 'logs')
    error_logs = [f for f in os.listdir(log_dir) if f.startswith('error.log')]
    
    # Should have main log and some rotated logs
    assert len(error_logs) > 1
    assert 'error.log' in error_logs

def test_log_handler_configuration():
    """Test log handler configuration."""
    logger = setup_logging()
    
    # Verify handler types and levels
    handler_types = {
        type(handler): handler.level 
        for handler in logger.handlers
    }
    
    # Should have file handlers for error and info, plus console handler
    assert len(handler_types) == 3
    assert any(isinstance(h, logging.StreamHandler) for h in logger.handlers)
    
    file_handlers = [h for h in logger.handlers if isinstance(h, logging.FileHandler)]
    levels = [h.level for h in file_handlers]
    assert logging.ERROR in levels
    assert logging.INFO in levels

def test_log_message_with_exception(temp_log_dir):
    """Test logging with exception information."""
    setup_logging()
    
    try:
        raise ValueError("Test exception")
    except ValueError as e:
        logger.error("Error occurred", exc_info=True)
    
    # Read error log
    error_log = os.path.join(temp_log_dir, 'logs', 'error.log')
    with open(error_log, 'r') as f:
        log_content = f.read()
    
    # Verify exception info is logged
    assert "Error occurred" in log_content
    assert "ValueError: Test exception" in log_content
    assert "Traceback" in log_content

def test_log_message_with_extra_fields(temp_log_dir):
    """Test logging with extra fields."""
    setup_logging()
    
    extra = {
        'user_id': 123,
        'action': 'test_action'
    }
    logger.info("Test message with extra", extra=extra)
    
    # Read info log
    info_log = os.path.join(temp_log_dir, 'logs', 'info.log')
    with open(info_log, 'r') as f:
        log_line = f.readline().strip()
    
    # Verify extra fields are included
    assert "Test message with extra" in log_line
    assert str(extra['user_id']) in log_line
    assert extra['action'] in log_line

def test_concurrent_logging(temp_log_dir):
    """Test concurrent logging from multiple threads."""
    import threading
    import queue
    
    setup_logging()
    message_queue = queue.Queue()
    
    def log_worker():
        for i in range(100):
            message = f"Test message {threading.current_thread().name} - {i}"
            logger.info(message)
            message_queue.put(message)
    
    # Create and start threads
    threads = []
    for i in range(3):
        t = threading.Thread(target=log_worker)
        threads.append(t)
        t.start()
    
    # Wait for threads to complete
    for t in threads:
        t.join()
    
    # Verify all messages were logged
    info_log = os.path.join(temp_log_dir, 'logs', 'info.log')
    with open(info_log, 'r') as f:
        log_content = f.read()
    
    while not message_queue.empty():
        message = message_queue.get()
        assert message in log_content

def test_log_file_permissions(temp_log_dir):
    """Test log file permissions."""
    setup_logging()
    
    logger.info("Test message")
    
    info_log = os.path.join(temp_log_dir, 'logs', 'info.log')
    error_log = os.path.join(temp_log_dir, 'logs', 'error.log')
    
    # Check file permissions (should be readable and writable by owner)
    assert os.access(info_log, os.R_OK | os.W_OK)
    assert os.access(error_log, os.R_OK | os.W_OK)

def test_logger_name_propagation(temp_log_dir):
    """Test logger name propagation in log messages."""
    setup_logging()
    
    # Create child logger
    child_logger = logging.getLogger("test.child")
    child_logger.info("Test child logger message")
    
    # Read info log
    info_log = os.path.join(temp_log_dir, 'logs', 'info.log')
    with open(info_log, 'r') as f:
        log_line = f.readline().strip()
    
    # Verify logger name is included
    assert "test.child" in log_line

def test_logging_performance(temp_log_dir):
    """Test logging performance."""
    import time
    
    setup_logging()
    
    # Log multiple messages and measure time
    start_time = time.time()
    for i in range(1000):
        logger.info(f"Performance test message {i}")
    end_time = time.time()
    
    # Should be reasonably fast (adjust threshold as needed)
    assert end_time - start_time < 2.0  # Should take less than 2 seconds 