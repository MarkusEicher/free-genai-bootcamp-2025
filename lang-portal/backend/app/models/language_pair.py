from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base

class LanguagePair(Base):
    __tablename__ = "language_pairs"

    id = Column(Integer, primary_key=True, index=True)
    source_language_id = Column(Integer, ForeignKey("languages.id"))
    target_language_id = Column(Integer, ForeignKey("languages.id"))

    source_language = relationship("Language", foreign_keys=[source_language_id])
    target_language = relationship("Language", foreign_keys=[target_language_id])

    __table_args__ = (
        UniqueConstraint('source_language_id', 'target_language_id', name='unique_language_pair'),
    ) 