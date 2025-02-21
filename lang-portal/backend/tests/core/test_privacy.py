"""Tests for privacy features in logging and caching."""
import pytest
import logging
import json
from pathlib import Path
from datetime import datetime, timedelta
from app.core.logging import PrivacyFormatter, SecureRotatingFileHandler, setup_logging
from app.core.cache import LocalCache, cache_response
from app.core.config import settings

@pytest.fixture
def privacy_formatter():
    """Create a privacy formatter instance."""
    return PrivacyFormatter('%(message)s')

@pytest.fixture
def temp_log_file(tmp_path):
    """Create a temporary log file."""
    return tmp_path / "test.log"

@pytest.fixture
def secure_handler(temp_log_file):
    """Create a secure rotating file handler."""
    return SecureRotatingFileHandler(
        temp_log_file,
        maxBytes=1024,
        backupCount=2,
        encoding='utf-8'
    )

class TestPrivacyFormatter:
    """Test suite for privacy formatter."""
    
    def test_sanitize_email(self, privacy_formatter):
        """Test email address sanitization."""
        record = logging.LogRecord(
            'test', logging.INFO, 'path', 1,
            'User email: test@example.com', None, None
        )
        result = privacy_formatter.format(record)
        assert 'test@example.com' not in result
        assert '[EMAIL]' in result
    
    def test_sanitize_ip(self, privacy_formatter):
        """Test IP address sanitization."""
        record = logging.LogRecord(
            'test', logging.INFO, 'path', 1,
            'Client IP: 192.168.1.1', None, None
        )
        result = privacy_formatter.format(record)
        assert '192.168.1.1' not in result
        assert '[IP]' in result
    
    def test_sanitize_sensitive_keys(self, privacy_formatter):
        """Test sensitive key sanitization."""
        record = logging.LogRecord(
            'test', logging.INFO, 'path', 1,
            'message', None, None
        )
        record.extra = {
            'password': 'secret123',
            'token': 'abc123',
            'safe_key': 'visible'
        }
        result = privacy_formatter.format(record)
        assert 'secret123' not in result
        assert 'abc123' not in result
        assert '[REDACTED]' in result
        assert 'visible' in result
    
    def test_sanitize_nested_dict(self, privacy_formatter):
        """Test nested dictionary sanitization."""
        record = logging.LogRecord(
            'test', logging.INFO, 'path', 1,
            'message', None, None
        )
        record.extra = {
            'user': {
                'id': '12345',
                'email': 'test@example.com',
                'settings': {
                    'token': 'abc123'
                }
            }
        }
        result = privacy_formatter.format(record)
        assert 'test@example.com' not in result
        assert 'abc123' not in result
        assert '[EMAIL]' in result
        assert '[REDACTED]' in result

class TestSecureRotatingHandler:
    """Test suite for secure rotating handler."""
    
    def test_secure_file_deletion(self, secure_handler, temp_log_file):
        """Test secure file deletion during rotation."""
        # Write data to fill the file
        for i in range(100):
            secure_handler.emit(
                logging.LogRecord(
                    'test', logging.INFO, 'path', 1,
                    f'Test message {i}', None, None
                )
            )
        
        # Check that backup files exist and original is overwritten
        backup_file = Path(str(temp_log_file) + '.1')
        assert backup_file.exists()
        
        # Check file contents are not plaintext
        with open(backup_file, 'rb') as f:
            content = f.read()
            assert b'Test message' not in content
    
    def test_rotation_cleanup(self, secure_handler, temp_log_file):
        """Test cleanup of old log files during rotation."""
        # Create maximum number of backup files
        for i in range(5):
            secure_handler.emit(
                logging.LogRecord(
                    'test', logging.INFO, 'path', 1,
                    'A' * 1024, None, None
                )
            )
        
        # Verify old files are securely deleted
        max_backup = Path(str(temp_log_file) + '.2')
        assert not max_backup.exists()

class TestPrivacyCache:
    """Test suite for privacy-focused caching."""
    
    @pytest.fixture
    def cache_instance(self):
        """Create a cache instance."""
        return LocalCache.get_instance()
    
    def test_sensitive_data_sanitization(self, cache_instance):
        """Test sanitization of sensitive data in cache."""
        key = "test_key"
        sensitive_data = {
            "user_id": "12345",
            "email": "test@example.com",
            "token": "secret_token",
            "safe_data": "visible"
        }
        
        # Store data in cache
        cache_instance.set(key, sensitive_data)
        
        # Retrieve data
        cached_data = cache_instance.get(key)
        
        # Check sanitization
        assert cached_data["user_id"] == "[ID]"
        assert cached_data["email"] == "[EMAIL]"
        assert cached_data["token"] == "[REDACTED]"
        assert cached_data["safe_data"] == "visible"
    
    def test_secure_cache_deletion(self, cache_instance, tmp_path):
        """Test secure deletion of cache files."""
        key = "test_key"
        sensitive_data = {"secret": "sensitive_info"}
        
        # Store data
        cache_instance.set(key, sensitive_data)
        
        # Delete data
        cache_instance.delete(key)
        
        # Verify data is securely deleted
        cache_file = cache_instance._get_cache_path(key)
        assert not Path(cache_file).exists()
    
    def test_cache_expiration(self, cache_instance):
        """Test secure handling of expired cache entries."""
        key = "test_key"
        sensitive_data = {"token": "secret_token"}
        
        # Store data with short expiration
        cache_instance.set(key, sensitive_data, expire=1)
        
        # Wait for expiration
        import time
        time.sleep(2)
        
        # Verify data is removed
        assert cache_instance.get(key) is None
        assert not Path(cache_instance._get_cache_path(key)).exists()

@pytest.mark.asyncio
async def test_privacy_focused_logging_setup():
    """Test privacy-focused logging setup."""
    logger = setup_logging()
    
    # Test log levels
    assert logger.level == logging.INFO
    
    # Test handlers configuration
    handlers = logger.handlers
    assert any(isinstance(h, SecureRotatingFileHandler) for h in handlers)
    assert any(isinstance(h, logging.StreamHandler) for h in handlers)
    
    # Test formatter configuration
    for handler in handlers:
        assert isinstance(handler.formatter, PrivacyFormatter)
        
    # Test logging with sensitive data
    sensitive_message = "User test@example.com with ID 12345 and token abc123"
    logger.info(sensitive_message)
    
    # Verify log file contents
    log_file = Path(settings.BACKEND_DIR) / 'logs' / 'info.log'
    with open(log_file, 'r') as f:
        log_content = f.read()
        assert 'test@example.com' not in log_content
        assert '12345' not in log_content
        assert 'abc123' not in log_content
        assert '[EMAIL]' in log_content
        assert '[ID]' in log_content
        assert '[REDACTED]' in log_content 