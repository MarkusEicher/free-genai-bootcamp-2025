"""create activity tables

Revision ID: 001
Revises: e5fba5eb1a76
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001'
down_revision = 'e5fba5eb1a76'
branch_labels = None
depends_on = None

def upgrade():
    # Create activities table
    op.create_table(
        'activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('end_time', sa.DateTime(timezone=True)),
        sa.Column('correct_count', sa.Integer(), server_default=sa.text('0')),
        sa.Column('incorrect_count', sa.Integer(), server_default=sa.text('0')),
        sa.Column('success_rate', sa.Float(), server_default=sa.text('0.0')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE')
    )
    
    # Create activity_progress table
    op.create_table(
        'activity_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('vocabulary_id', sa.Integer(), nullable=False),
        sa.Column('correct_count', sa.Integer(), server_default=sa.text('0')),
        sa.Column('attempt_count', sa.Integer(), server_default=sa.text('0')),
        sa.Column('last_attempt', sa.DateTime(timezone=True)),
        sa.Column('success_rate', sa.Float(), server_default=sa.text('0.0')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], ondelete='CASCADE')
    )

def downgrade():
    op.drop_table('activity_progress')
    op.drop_table('sessions')
    op.drop_table('activities')