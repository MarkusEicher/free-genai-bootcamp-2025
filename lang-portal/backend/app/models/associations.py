from sqlalchemy import Table, Column, Integer, ForeignKey, DateTime, func
from app.db.base_class import Base

# Association table for activity-vocabulary relationship
activity_vocabulary = Table(
    'activity_vocabulary',
    Base.metadata,
    Column('activity_id', Integer, ForeignKey('activities.id', ondelete="CASCADE")),
    Column('vocabulary_id', Integer, ForeignKey('vocabularies.id', ondelete="CASCADE"))
)

# Association table for activity-vocabulary-group relationship
activity_vocabulary_group = Table(
    'activity_vocabulary_group',
    Base.metadata,
    Column('activity_id', Integer, ForeignKey('activities.id', ondelete="CASCADE")),
    Column('group_id', Integer, ForeignKey('vocabulary_groups.id', ondelete="CASCADE")),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)

# Association table for vocabulary-group relationship
vocabulary_group_association = Table(
    'vocabulary_group_association',
    Base.metadata,
    Column('vocabulary_id', Integer, ForeignKey('vocabularies.id', ondelete="CASCADE")),
    Column('group_id', Integer, ForeignKey('vocabulary_groups.id', ondelete="CASCADE"))
) 