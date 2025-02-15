import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base, get_db
from app.main import app
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary import Vocabulary
from app.models.vocabulary_group import VocabularyGroup
from app.models.progress import VocabularyProgress

# Use in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # Don't close the session here
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_data(db_session):
    # Create test languages
    en = Language(code="en", name="English")
    es = Language(code="es", name="Spanish")
    db_session.add_all([en, es])
    db_session.flush()

    # Create language pair
    pair = LanguagePair(source_language_id=en.id, target_language_id=es.id)
    db_session.add(pair)
    db_session.flush()

    # Create vocabulary group
    group = VocabularyGroup(
        name="Test Group",
        description="Test Description",
        language_pair_id=pair.id
    )
    db_session.add(group)
    db_session.flush()

    # Create vocabulary
    vocab = Vocabulary(
        word="hello",
        translation="hola",
        language_pair_id=pair.id
    )
    vocab.groups.append(group)
    db_session.add(vocab)
    db_session.commit()

    return {
        "languages": {"en": en, "es": es},
        "pair": pair,
        "group": group,
        "vocabulary": vocab
    } 