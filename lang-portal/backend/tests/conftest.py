import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.db.database import Base, get_db
from app.main import app
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from app.models.progress import VocabularyProgress
from alembic.config import Config
from alembic import command
from sqlalchemy import event
from datetime import datetime, UTC

# Test database setup
TEST_DATABASE_URL = settings.TEST_DATABASE_URL
engine = create_engine(
    TEST_DATABASE_URL,
    echo=settings.TEST_DB_ECHO,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migrations(database_url: str):
    """Run migrations on specified database"""
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(alembic_cfg, "head")

@pytest.fixture(scope="session")
def test_engine():
    """Create test engine and run migrations"""
    # Create all tables
    Base.metadata.drop_all(bind=engine)  # Clean start
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup after all tests
    if not settings.KEEP_TEST_DB:
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

# Model fixtures
@pytest.fixture(scope="function")
def test_language(db_session):
    language = Language(code="en", name="English")
    db_session.add(language)
    db_session.commit()
    return language

@pytest.fixture(scope="function")
def test_language_pair(db_session, test_language):
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
def test_vocabulary(db_session, test_language_pair):
    vocabulary = Vocabulary(
        word="test",
        translation="test",
        language_pair_id=test_language_pair.id
    )
    db_session.add(vocabulary)
    db_session.commit()
    return vocabulary

@pytest.fixture(scope="function")
def test_vocabulary_with_progress(db_session, test_vocabulary):
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=8,
        incorrect_attempts=2,
        mastered=True,
        last_reviewed=datetime.now(UTC)
    )
    db_session.add(progress)
    db_session.commit()
    return test_vocabulary

@pytest.fixture(scope="function")
def test_vocabulary_group(db_session, test_language_pair):
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=test_language_pair.id
    )
    db_session.add(group)
    db_session.commit()
    return group

@pytest.fixture
def test_progress(db: Session, test_vocabulary):
    """
    Creates a test progress record.
    Depends on test_vocabulary fixture.
    """
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=5,
        incorrect_attempts=2,
        mastered=False
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

@pytest.fixture
def test_language_with_progress(db_session: Session, test_vocabulary):
    """Creates a test language with vocabulary and progress"""
    progress = VocabularyProgress(
        vocabulary_id=test_vocabulary.id,
        correct_attempts=10,
        incorrect_attempts=5,
        mastered=True,
        last_reviewed=datetime.utcnow()
    )
    db_session.add(progress)
    db_session.commit()
    db_session.refresh(progress)
    return test_vocabulary.language_pair.source_language

@pytest.fixture
def test_vocabulary_group_with_vocabularies(db_session: Session, test_vocabulary_group, test_vocabulary):
    """Creates a test vocabulary group with vocabularies"""
    test_vocabulary_group.vocabularies.append(test_vocabulary)
    db_session.commit()
    db_session.refresh(test_vocabulary_group)
    return test_vocabulary_group

@pytest.fixture
def db():
    """Returns a database session for testing"""
    return db_session