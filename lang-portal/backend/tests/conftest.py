import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, UTC, timedelta
from pathlib import Path
import shutil

from app.core.config import settings
from app.db.base_class import Base
from app.db.database import get_db, engine
from app.main import app
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from app.models.activity import Activity, Session as ActivitySession, SessionAttempt
from app.models.progress import VocabularyProgress
from app.core.cache import LocalCache

# Test database setup
TEST_DATABASE_URL = settings.TEST_DATABASE_URL
engine = create_engine(
    TEST_DATABASE_URL,
    echo=settings.TEST_DB_ECHO,
    connect_args={
        "check_same_thread": False,
        "timeout": 30
    }
)

# Test cache setup
TEST_CACHE_DIR = Path(settings.BACKEND_DIR) / "data" / "test_cache"

# Enable foreign key support for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging for better concurrency
    cursor.execute("PRAGMA synchronous=NORMAL")  # Faster writes with reasonable safety
    cursor.execute("PRAGMA cache_size=-2000")  # 2MB cache
    cursor.close()

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevent detached instance errors
)

@pytest.fixture(scope="session", autouse=True)
def test_engine():
    """Create test engine and run migrations"""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Enable foreign key support
    with engine.connect() as conn:
        conn.execute(text("PRAGMA foreign_keys=ON"))
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.execute(text("PRAGMA synchronous=NORMAL"))
        conn.execute(text("PRAGMA cache_size=-2000"))
        conn.commit()

    yield engine

    # Clean up after tests
    with engine.connect() as conn:
        # Drop tables in reverse dependency order
        tables = [
            "vocabulary_progress",
            "session_attempts",
            "vocabulary_group_association",
            "activity_vocabulary_group",
            "sessions",
            "activities",
            "vocabulary_groups",
            "vocabularies",
            "language_pairs",
            "languages"
        ]
        for table in tables:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {table}"))
            except:
                pass  # Ignore errors when dropping tables
        conn.commit()

@pytest.fixture(scope="function")
def test_cache():
    """Create a test cache instance."""
    # Ensure test cache directory exists
    TEST_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create cache instance with test directory
    cache = LocalCache()
    cache._cache_dir = TEST_CACHE_DIR
    
    yield cache
    
    # Clean up after test
    if TEST_CACHE_DIR.exists():
        shutil.rmtree(TEST_CACHE_DIR)

@pytest.fixture(scope="function")
def db_session(test_engine):
    """Create a new database session for a test."""
    SessionLocal = sessionmaker(bind=test_engine)
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()

# Alias for db_session for backward compatibility
@pytest.fixture(scope="function")
def db(db_session: Session) -> Session:
    """Alias for db_session fixture"""
    return db_session

@pytest.fixture(scope="function")
def client(db_session: Session):
    """Create a test client with database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_language(db_session: Session):
    """Create a test language."""
    language = Language(code="en", name="English")
    db_session.add(language)
    db_session.commit()
    return language

@pytest.fixture(scope="function")
def test_language_pair(db_session: Session, test_language):
    """Create a test language pair."""
    target_language = Language(code="de", name="German")
    db_session.add(target_language)
    db_session.commit()
    
    pair = LanguagePair(
        source_language_id=test_language.id,
        target_language_id=target_language.id
    )
    db_session.add(pair)
    db_session.commit()
    return pair

@pytest.fixture(scope="function")
def test_vocabulary(db_session: Session, test_language_pair):
    """Create a test vocabulary."""
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()
    return vocabulary

@pytest.fixture(scope="function")
def test_vocabulary_group(db_session: Session, test_language_pair):
    """Create a test vocabulary group."""
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_language_pair.id
    )
    db_session.add(group)
    db_session.commit()
    return group

@pytest.fixture(scope="function")
def test_activity(db_session: Session):
    """Create a test activity."""
    activity = Activity(
        type="flashcard",
        name="Test Activity",
        description="Test Description",
        practice_direction="forward"
    )
    db_session.add(activity)
    db_session.commit()
    return activity

@pytest.fixture(scope="function")
def test_activity_session(db_session: Session, test_activity):
    """Create a test activity session."""
    now = datetime.now(UTC)
    session = ActivitySession(
        activity_id=test_activity.id,
        start_time=now - timedelta(minutes=30),
        end_time=now
    )
    db_session.add(session)
    db_session.commit()
    return session

@pytest.fixture(scope="function")
def test_session_attempt(db_session: Session, test_activity_session, test_vocabulary):
    """Create a test session attempt."""
    attempt = SessionAttempt(
        session_id=test_activity_session.id,
        vocabulary_id=test_vocabulary.id,
        is_correct=True,
        response_time_ms=1500,
        created_at=datetime.now(UTC)
    )
    db_session.add(attempt)
    db_session.commit()
    return attempt

@pytest.fixture(scope="function")
def test_vocabulary_with_attempts(db_session: Session, test_vocabulary, test_activity_session):
    """Create a vocabulary with multiple attempts."""
    attempts = [
        SessionAttempt(
            session_id=test_activity_session.id,
            vocabulary_id=test_vocabulary.id,
            is_correct=i < 8,  # 8 correct, 2 incorrect
            response_time_ms=1500,
            created_at=datetime.now(UTC) - timedelta(minutes=i)
        )
        for i in range(10)
    ]
    for attempt in attempts:
        db_session.add(attempt)
    db_session.commit()
    return test_vocabulary

@pytest.fixture(autouse=True)
def clear_cache(test_cache):
    """Clear cache before each test."""
    if TEST_CACHE_DIR.exists():
        shutil.rmtree(TEST_CACHE_DIR)
    TEST_CACHE_DIR.mkdir(parents=True)
    yield
    if TEST_CACHE_DIR.exists():
        shutil.rmtree(TEST_CACHE_DIR)