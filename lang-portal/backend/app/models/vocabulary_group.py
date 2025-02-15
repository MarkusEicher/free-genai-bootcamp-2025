from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.database import Base

# Association table for many-to-many relationship
vocabulary_group_association = Table(
    'vocabulary_group_association',
    Base.metadata,
    Column('vocabulary_id', Integer, ForeignKey('vocabularies.id', ondelete='CASCADE')),
    Column('group_id', Integer, ForeignKey('vocabulary_groups.id', ondelete='CASCADE')),
    extend_existing=True
)

class VocabularyGroup(Base):
    __tablename__ = "vocabulary_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    language_pair_id = Column(Integer, ForeignKey("language_pairs.id"))

    language_pair = relationship("LanguagePair")
    vocabularies = relationship(
        "Vocabulary",
        secondary=vocabulary_group_association,
        back_populates="groups"
    ) 