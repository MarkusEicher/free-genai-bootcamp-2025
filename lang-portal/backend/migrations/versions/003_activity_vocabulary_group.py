"""activity vocabulary group relationship

Revision ID: 003
Revises: 002
Create Date: 2024-03-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

def upgrade():
    # Create new activity_vocabulary_group table
    op.create_table(
        'activity_vocabulary_group',
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), 
                 server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], 
                              ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['vocabulary_groups.id'], 
                              ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('activity_id', 'group_id')
    )
    
    # Add indexes for performance
    op.create_index('ix_activity_vocabulary_group_activity_id', 
                   'activity_vocabulary_group', ['activity_id'])
    op.create_index('ix_activity_vocabulary_group_group_id', 
                   'activity_vocabulary_group', ['group_id'])
    
    # Add practice_direction to activities
    with op.batch_alter_table('activities') as batch_op:
        batch_op.add_column(
            sa.Column('practice_direction', sa.String(), 
                     server_default='forward', nullable=False)
        )
    
    # Drop old activity_vocabulary table and its indexes
    op.drop_index('ix_activity_vocabulary_activity_id', 'activity_vocabulary')
    op.drop_index('ix_activity_vocabulary_vocabulary_id', 'activity_vocabulary')
    op.drop_table('activity_vocabulary')

def downgrade():
    # Recreate old activity_vocabulary table
    op.create_table(
        'activity_vocabulary',
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('vocabulary_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], 
                              ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], 
                              ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('activity_id', 'vocabulary_id')
    )
    
    # Recreate old indexes
    op.create_index('ix_activity_vocabulary_activity_id', 
                   'activity_vocabulary', ['activity_id'])
    op.create_index('ix_activity_vocabulary_vocabulary_id', 
                   'activity_vocabulary', ['vocabulary_id'])
    
    # Remove practice_direction from activities
    with op.batch_alter_table('activities') as batch_op:
        batch_op.drop_column('practice_direction')
    
    # Drop new table and its indexes
    op.drop_index('ix_activity_vocabulary_group_activity_id', 
                 'activity_vocabulary_group')
    op.drop_index('ix_activity_vocabulary_group_group_id', 
                 'activity_vocabulary_group')
    op.drop_table('activity_vocabulary_group')