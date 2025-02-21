"""add activity system v2

Revision ID: 006
Revises: 005
Create Date: 2024-03-21 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Modify activities table if it exists, otherwise create it
    if 'activities' not in tables:
        op.create_table(
            'activities',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('type', sa.String(), nullable=False),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('description', sa.String()),
            sa.Column('practice_direction', sa.String(), nullable=False, server_default='forward'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('CURRENT_TIMESTAMP')),
            sa.PrimaryKeyConstraint('id')
        )
    else:
        # Add new columns to activities table
        with op.batch_alter_table('activities') as batch_op:
            if 'practice_direction' not in [col['name'] for col in inspector.get_columns('activities')]:
                batch_op.add_column(sa.Column('practice_direction', sa.String(), nullable=False, server_default='forward'))
            if 'updated_at' not in [col['name'] for col in inspector.get_columns('activities')]:
                batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('CURRENT_TIMESTAMP')))

    # Create activity_vocabulary_group association table if it doesn't exist
    if 'activity_vocabulary_group' not in tables:
        op.create_table(
            'activity_vocabulary_group',
            sa.Column('activity_id', sa.Integer(), nullable=False),
            sa.Column('group_id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['group_id'], ['vocabulary_groups.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('activity_id', 'group_id')
        )

    # Modify sessions table if it exists, otherwise create it
    if 'sessions' not in tables:
        op.create_table(
            'sessions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('activity_id', sa.Integer(), nullable=False),
            sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
            sa.Column('end_time', sa.DateTime(timezone=True)),
            sa.Column('correct_count', sa.Integer(), server_default='0'),
            sa.Column('incorrect_count', sa.Integer(), server_default='0'),
            sa.Column('success_rate', sa.Float(), server_default='0.0'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
    else:
        # Add new columns to sessions table
        with op.batch_alter_table('sessions') as batch_op:
            if 'created_at' not in [col['name'] for col in inspector.get_columns('sessions')]:
                batch_op.add_column(sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')))
            if 'updated_at' not in [col['name'] for col in inspector.get_columns('sessions')]:
                batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('CURRENT_TIMESTAMP')))

    # Create session_attempts table if it doesn't exist
    if 'session_attempts' not in tables:
        op.create_table(
            'session_attempts',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('session_id', sa.Integer(), nullable=False),
            sa.Column('vocabulary_id', sa.Integer(), nullable=False),
            sa.Column('is_correct', sa.Boolean(), nullable=False),
            sa.Column('response_time_ms', sa.Integer()),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # Create indexes for better performance
    def create_index_if_not_exists(table_name, index_name, columns):
        if index_name not in [idx['name'] for idx in inspector.get_indexes(table_name)]:
            op.create_index(index_name, table_name, columns)

    # Create indexes for activities table
    create_index_if_not_exists('activities', 'ix_activities_type', ['type'])
    create_index_if_not_exists('activities', 'ix_activities_created_at', ['created_at'])
    create_index_if_not_exists('activities', 'ix_activities_name', ['name'])
    create_index_if_not_exists('activities', 'ix_activities_practice_direction', ['practice_direction'])

    # Create indexes for activity_vocabulary_group table
    if 'activity_vocabulary_group' in tables:
        create_index_if_not_exists('activity_vocabulary_group', 'ix_activity_vocabulary_group_activity_id', ['activity_id'])
        create_index_if_not_exists('activity_vocabulary_group', 'ix_activity_vocabulary_group_group_id', ['group_id'])
        create_index_if_not_exists('activity_vocabulary_group', 'ix_activity_vocabulary_group_created_at', ['created_at'])

    # Create indexes for sessions table
    create_index_if_not_exists('sessions', 'ix_sessions_activity_id', ['activity_id'])
    create_index_if_not_exists('sessions', 'ix_sessions_start_time', ['start_time'])
    create_index_if_not_exists('sessions', 'ix_sessions_end_time', ['end_time'])
    create_index_if_not_exists('sessions', 'ix_sessions_created_at', ['created_at'])

    # Create indexes for session_attempts table
    if 'session_attempts' in tables:
        create_index_if_not_exists('session_attempts', 'ix_session_attempts_session_id', ['session_id'])
        create_index_if_not_exists('session_attempts', 'ix_session_attempts_vocabulary_id', ['vocabulary_id'])
        create_index_if_not_exists('session_attempts', 'ix_session_attempts_is_correct', ['is_correct'])
        create_index_if_not_exists('session_attempts', 'ix_session_attempts_created_at', ['created_at'])
        create_index_if_not_exists('session_attempts', 'ix_session_attempts_response_time', ['response_time_ms'])

def downgrade():
    # Drop all tables and indexes in reverse order
    op.drop_table('session_attempts')
    op.drop_table('sessions')
    op.drop_table('activity_vocabulary_group')
    op.drop_table('activities') 