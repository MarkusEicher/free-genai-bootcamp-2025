from sqlalchemy import Column, Integer, String
from app.db.database import Base

class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(2), unique=True, index=True)  # ISO 639-1 code (e.g., 'en', 'es')
    name = Column(String, unique=True)  # Full name (e.g., 'English', 'Spanish') 