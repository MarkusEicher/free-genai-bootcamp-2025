from typing import Generator
from sqlalchemy.orm import Session

from app.db.database import engine

def get_db() -> Generator[Session, None, None]:
    """
    Get a database session.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = Session(engine)
    try:
        yield db
    finally:
        db.close() 