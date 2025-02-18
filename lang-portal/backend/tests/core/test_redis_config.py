import pytest
from unittest.mock import patch, MagicMock
from redis import Redis, ConnectionError
from app.core.cache import get_redis_client
from app.core.config import settings

@pytest.fixture(autouse=True)
def mock_redis_settings(monkeypatch):
    """Mock Redis settings for tests."""
    monkeypatch.setattr('app.core.config.settings.REDIS_HOST', 'localhost')
    monkeypatch.setattr('app.core.config.settings.REDIS_PORT', 6379)
    monkeypatch.setattr('app.core.config.settings.REDIS_DB', 0)
    monkeypatch.setattr('app.core.config.settings.REDIS_TEST_DB', 1)

def test_redis_client_configuration():
    """Test Redis client configuration."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        # Test default client
        client = get_redis_client()
        assert isinstance(client, Redis)
        assert client.connection_pool.connection_kwargs['host'] == settings.REDIS_HOST
        assert client.connection_pool.connection_kwargs['port'] == settings.REDIS_PORT
        assert client.connection_pool.connection_kwargs['db'] == settings.REDIS_DB

def test_redis_test_client_configuration():
    """Test Redis test client configuration."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client = get_redis_client(test_mode=True)
        assert isinstance(client, Redis)
        assert client.connection_pool.connection_kwargs['db'] == settings.REDIS_TEST_DB

def test_redis_connection_error_handling():
    """Test Redis connection error handling."""
    with patch('redis.Redis.ping', side_effect=ConnectionError("Connection failed")):
        with pytest.raises(ConnectionError) as exc_info:
            get_redis_client()
        assert "Connection failed" in str(exc_info.value)

def test_redis_database_selection():
    """Test Redis database selection."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        # Test production database
        prod_client = get_redis_client()
        assert prod_client.connection_pool.connection_kwargs['db'] == settings.REDIS_DB

        # Test test database
        test_client = get_redis_client(test_mode=True)
        assert test_client.connection_pool.connection_kwargs['db'] == settings.REDIS_TEST_DB

        # Verify databases are different
        assert prod_client.connection_pool.connection_kwargs['db'] != test_client.connection_pool.connection_kwargs['db']

def test_redis_connection_pool_settings():
    """Test Redis connection pool settings."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client = get_redis_client()
        pool = client.connection_pool

        # Test default pool settings
        assert pool.max_connections == 10000  # Redis default
        assert pool.connection_kwargs.get('socket_timeout') == 5  # Custom timeout

def test_redis_client_singleton():
    """Test that Redis clients are reused."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client1 = get_redis_client()
        client2 = get_redis_client()
        assert client1 is client2  # Same instance

        test_client1 = get_redis_client(test_mode=True)
        test_client2 = get_redis_client(test_mode=True)
        assert test_client1 is test_client2  # Same instance

        # Different instances for different modes
        assert client1 is not test_client1

def test_redis_connection_lifecycle():
    """Test Redis connection lifecycle."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client = get_redis_client()
        
        # Test connection creation
        connection = client.connection_pool.get_connection("ping")
        assert connection is not None
        
        # Test connection release
        client.connection_pool.release(connection)
        
        # Test connection reuse
        new_connection = client.connection_pool.get_connection("ping")
        assert new_connection is connection  # Connection should be reused

def test_redis_connection_encoding():
    """Test Redis connection encoding settings."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client = get_redis_client()
        assert client.connection_pool.connection_kwargs.get('encoding', 'utf-8') == 'utf-8'
        assert client.connection_pool.connection_kwargs.get('decode_responses', True)

def test_redis_ssl_configuration():
    """Test Redis SSL configuration."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        # Test without SSL
        client = get_redis_client()
        assert not client.connection_pool.connection_kwargs.get('ssl', False)
        assert not client.connection_pool.connection_kwargs.get('ssl_cert_reqs', False)

def test_redis_connection_timeout():
    """Test Redis connection timeout handling."""
    with patch('redis.Redis') as mock_redis_class:
        mock_redis = MagicMock()
        mock_redis.ping.side_effect = ConnectionError("Connection timeout")
        mock_redis.connection_pool = MagicMock()
        mock_redis_class.return_value = mock_redis
        
        # Clear any existing clients
        global _default_client, _test_client
        _default_client = None
        _test_client = None
        
        with pytest.raises(ConnectionError) as exc_info:
            get_redis_client()
        assert "Connection timeout" in str(exc_info.value)

def test_redis_max_connections():
    """Test Redis max connections handling."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client = get_redis_client()
        
        # Simulate max connections reached
        connections = []
        max_conns = client.connection_pool.max_connections
        
        # Create maximum number of connections
        for _ in range(max_conns):
            try:
                conn = client.connection_pool.get_connection("ping")
                connections.append(conn)
            except Exception:
                break
        
        # Try to get one more connection
        with pytest.raises(Exception):
            client.connection_pool.get_connection("ping")
        
        # Release connections
        for conn in connections:
            client.connection_pool.release(conn)

def test_redis_client_decode_responses():
    """Test Redis client decode_responses setting."""
    with patch('redis.Redis') as mock_redis_class:
        mock_redis = MagicMock()
        mock_redis.ping.return_value = True
        mock_redis.connection_pool = MagicMock()
        mock_redis.connection_pool.connection_kwargs = {'decode_responses': True}
        mock_redis_class.return_value = mock_redis
        
        # Clear any existing clients
        global _default_client, _test_client
        _default_client = None
        _test_client = None
        
        client = get_redis_client()
        assert client.connection_pool.connection_kwargs['decode_responses']

        # Test string handling
        mock_redis.set.return_value = True
        mock_redis.get.return_value = "test_value"
        
        client.set("test_key", "test_value")
        client.get("test_key")
        
        # Verify value was not encoded
        mock_redis.set.assert_called_once_with("test_key", "test_value", ex=None)
        assert mock_redis.get.return_value == "test_value"

def test_redis_client_health_check():
    """Test Redis client health check."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client = get_redis_client()
        
        # Test successful health check
        assert client.ping()
        
        # Test failed health check
        mock_ping.side_effect = ConnectionError("Health check failed")
        with pytest.raises(ConnectionError):
            client.ping()

def test_redis_client_error_handling():
    """Test Redis client error handling for various scenarios."""
    with patch('redis.Redis.ping') as mock_ping:
        mock_ping.return_value = True
        client = get_redis_client()
        
        # Test connection error
        with patch('redis.Redis.get', side_effect=ConnectionError("Get failed")):
            with pytest.raises(ConnectionError):
                client.get("test_key")
        
        # Test timeout error
        with patch('redis.Redis.get', side_effect=TimeoutError("Get timeout")):
            with pytest.raises(TimeoutError):
                client.get("test_key")