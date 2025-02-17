from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# Association table for many-to-many relationship
vocabulary_group_association = Table(
    'vocabulary_group_association',
    Base.metadata,
    Column('vocabulary_id', Integer, ForeignKey('vocabularies.id', ondelete="CASCADE")),
    Column('group_id', Integer, ForeignKey('vocabulary_groups.id', ondelete="CASCADE"))
)

class VocabularyGroup(Base):
    __tablename__ = "vocabulary_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    language_pair_id = Column(Integer, ForeignKey("language_pairs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    language_pair = relationship("LanguagePair", back_populates="vocabulary_groups")
    vocabularies = relationship(
        "Vocabulary",
        secondary=vocabulary_group_association,
        back_populates="groups"
    )