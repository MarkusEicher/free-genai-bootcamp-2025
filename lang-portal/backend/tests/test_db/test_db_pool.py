import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import QueuePool, NullPool
from sqlalchemy.exc import TimeoutError, OperationalError
from app.core.config import settings
from app.db.database import get_db
from app.db.base_class import Base
import threading
import time
import queue

def test_db_pool_configuration():
    """Test database pool configuration."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT
    )
    
    # Test pool settings
    assert isinstance(engine.pool, QueuePool)
    assert engine.pool.size() == settings.DB_POOL_SIZE
    assert engine.pool._max_overflow == settings.DB_MAX_OVERFLOW
    assert engine.pool._timeout == settings.DB_POOL_TIMEOUT

def test_db_pool_connection_acquisition():
    """Test database connection acquisition from pool."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=2,
        max_overflow=1
    )
    
    # Get connections up to pool size
    conn1 = engine.connect()
    conn2 = engine.connect()
    assert engine.pool.checkedin() == 0
    assert engine.pool.checkedout() == 2
    
    # Get one more connection (from overflow)
    conn3 = engine.connect()
    assert engine.pool.overflow() == 1
    
    # Clean up
    conn1.close()
    conn2.close()
    conn3.close()
    engine.dispose()

def test_db_pool_connection_timeout():
    """Test database connection timeout."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1,
        max_overflow=0,
        pool_timeout=1
    )
    
    # Acquire the only connection
    conn = engine.connect()
    
    # Try to get another connection
    with pytest.raises(TimeoutError):
        engine.connect()
    
    # Clean up
    conn.close()
    engine.dispose()

def test_db_pool_connection_recycling():
    """Test database connection recycling."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1,
        pool_recycle=1  # Recycle after 1 second
    )
    
    # Get initial connection
    conn1 = engine.connect()
    conn1_id = id(conn1.connection)
    conn1.close()
    
    # Wait for recycle
    time.sleep(2)
    
    # Get new connection
    conn2 = engine.connect()
    conn2_id = id(conn2.connection)
    conn2.close()
    
    # IDs should be different due to recycling
    assert conn1_id != conn2_id
    engine.dispose()

def test_db_pool_concurrent_access():
    """Test concurrent database access."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=5,
        max_overflow=2
    )
    Session = scoped_session(sessionmaker(bind=engine))
    
    def worker():
        session = Session()
        try:
            # Perform a simple query
            session.execute(text("SELECT 1"))
            session.commit()
        finally:
            session.close()
    
    # Run multiple threads
    threads = []
    for _ in range(7):  # More than pool_size but less than pool_size + max_overflow
        t = threading.Thread(target=worker)
        threads.append(t)
        t.start()
    
    # Wait for all threads
    for t in threads:
        t.join()
    
    engine.dispose()

def test_db_pool_overflow_handling():
    """Test database pool overflow handling."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=2,
        max_overflow=1
    )
    
    connections = []
    try:
        # Get connections up to pool_size + max_overflow
        for _ in range(3):
            connections.append(engine.connect())
        
        # Try to get one more connection
        with pytest.raises(TimeoutError):
            engine.connect()
    finally:
        # Clean up
        for conn in connections:
            conn.close()
        engine.dispose()

def test_db_pool_connection_invalidation():
    """Test database connection invalidation."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1
    )
    
    # Get connection
    conn = engine.connect()
    
    # Invalidate connection
    conn.invalidate()
    
    # Connection should be unusable
    with pytest.raises(Exception):
        conn.execute(text("SELECT 1"))
    
    # Clean up
    conn.close()
    engine.dispose()

def test_db_pool_connection_info():
    """Test database pool connection information."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=2,
        max_overflow=1
    )
    
    # Test initial state
    assert engine.pool.size() == 2
    assert engine.pool.checkedout() == 0
    assert engine.pool.checkedin() == 0
    
    # Get some connections
    conn1 = engine.connect()
    conn2 = engine.connect()
    
    # Test active connections
    assert engine.pool.checkedout() == 2
    assert engine.pool.checkedin() == 0
    
    # Return connections
    conn1.close()
    conn2.close()
    
    # Test final state
    assert engine.pool.checkedout() == 0
    engine.dispose()

def test_db_pool_dispose():
    """Test database pool disposal."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=2
    )
    
    # Get some connections
    conn1 = engine.connect()
    conn2 = engine.connect()
    
    # Close connections
    conn1.close()
    conn2.close()
    
    # Dispose pool
    engine.dispose()
    
    # Pool should be empty
    assert engine.pool.checkedout() == 0
    assert engine.pool.checkedin() == 0

def test_db_pool_checkout_listener():
    """Test database pool checkout listener."""
    checkout_events = queue.Queue()
    
    def on_checkout(dbapi_conn, connection_record, connection_proxy):
        checkout_events.put("checkout")
    
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1,
        listeners=[('checkout', on_checkout)]
    )
    
    # Get connection
    conn = engine.connect()
    
    # Verify checkout event
    assert checkout_events.get_nowait() == "checkout"
    
    # Clean up
    conn.close()
    engine.dispose()

def test_db_pool_checkin_listener():
    """Test database pool checkin listener."""
    checkin_events = queue.Queue()
    
    def on_checkin(dbapi_conn, connection_record):
        checkin_events.put("checkin")
    
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1,
        listeners=[('checkin', on_checkin)]
    )
    
    # Get and return connection
    conn = engine.connect()
    conn.close()
    
    # Verify checkin event
    assert checkin_events.get_nowait() == "checkin"
    
    engine.dispose()

def test_db_pool_with_transaction():
    """Test database pool with transaction."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1
    )
    
    # Start transaction
    conn = engine.connect()
    trans = conn.begin()
    
    try:
        # Execute some SQL
        conn.execute(text("CREATE TABLE IF NOT EXISTS test (id INTEGER)"))
        conn.execute(text("INSERT INTO test (id) VALUES (1)"))
        
        # Rollback transaction
        trans.rollback()
        
        # Verify rollback
        result = conn.execute(text("SELECT COUNT(*) FROM test")).scalar()
        assert result == 0
    finally:
        # Clean up
        conn.execute(text("DROP TABLE IF EXISTS test"))
        conn.close()
        engine.dispose()

def test_db_pool_reset_on_return():
    """Test database connection reset on return to pool."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1,
        reset_on_return=True
    )
    
    # Use connection
    with engine.connect() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS test (id INTEGER)"))
        conn.execute(text("INSERT INTO test (id) VALUES (1)"))
    
    # Get new connection from pool
    with engine.connect() as conn:
        # Previous transaction should be rolled back
        result = conn.execute(text("SELECT COUNT(*) FROM test")).scalar()
        assert result == 1
        
        # Clean up
        conn.execute(text("DROP TABLE IF EXISTS test"))
    
    engine.dispose()

def test_db_pool_pre_ping():
    """Test database connection pre-ping."""
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=1,
        pool_pre_ping=True
    )
    
    # Get connection
    conn = engine.connect()
    
    # Connection should be valid
    assert not conn.closed
    
    # Clean up
    conn.close()
    engine.dispose() 