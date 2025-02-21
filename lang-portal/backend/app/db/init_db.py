from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base_class import Base

# Import all models to ensure they are registered with SQLAlchemy
from app.models.language import Language
from app.models.language_pair import LanguagePair
from app.models.vocabulary_group import VocabularyGroup
from app.models.vocabulary import Vocabulary
from app.models.activity import Activity, Session, SessionAttempt
from app.models.progress import VocabularyProgress

def init_db(db_url: str = settings.DATABASE_URL):
    """Initialize the database connection."""
    engine = create_engine(db_url)
    
    # Enable foreign key support for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    
    return engine

if __name__ == "__main__":
    init_db() 