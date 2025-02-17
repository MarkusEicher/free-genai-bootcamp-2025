"""restructure activity models

Revision ID: 002
Revises: 001
Create Date: 2024-03-21 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Create activity_vocabulary association table
    op.create_table(
        'activity_vocabulary',
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('vocabulary_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('activity_id', 'vocabulary_id')
    )

    # Create session_attempts table
    op.create_table(
        'session_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('vocabulary_id', sa.Integer(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('response_time_ms', sa.Integer()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Add created_at to sessions table
    op.add_column('sessions', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')))

    # Migrate existing activity progress data to session attempts
    # Note: SQLite doesn't support direct ALTER TABLE operations, so we need to do this in batches
    conn = op.get_bind()
    
    # First, create temporary sessions for existing progress
    conn.execute(text("""
        INSERT INTO sessions (activity_id, start_time, end_time, created_at)
        SELECT DISTINCT activity_id, last_attempt, last_attempt, last_attempt
        FROM activity_progress
        WHERE last_attempt IS NOT NULL
    """))

    # Then create session attempts from activity progress
    conn.execute(text("""
        INSERT INTO session_attempts (session_id, vocabulary_id, is_correct, created_at)
        SELECT s.id, ap.vocabulary_id, 
               CASE WHEN ap.correct_count > 0 THEN 1 ELSE 0 END,
               ap.last_attempt
        FROM activity_progress ap
        JOIN sessions s ON s.activity_id = ap.activity_id
        WHERE ap.last_attempt IS NOT NULL
    """))

    # Create activity-vocabulary associations from existing progress
    conn.execute(text("""
        INSERT INTO activity_vocabulary (activity_id, vocabulary_id)
        SELECT DISTINCT activity_id, vocabulary_id
        FROM activity_progress
    """))

    # Drop old columns from sessions table
    with op.batch_alter_table('sessions') as batch_op:
        batch_op.drop_column('correct_count')
        batch_op.drop_column('incorrect_count')
        batch_op.drop_column('success_rate')

    # Drop old activity_progress table
    op.drop_table('activity_progress')

def downgrade():
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

    # Add back columns to sessions table
    op.add_column('sessions', sa.Column('correct_count', sa.Integer(), server_default=sa.text('0')))
    op.add_column('sessions', sa.Column('incorrect_count', sa.Integer(), server_default=sa.text('0')))
    op.add_column('sessions', sa.Column('success_rate', sa.Float(), server_default=sa.text('0.0')))

    # Migrate data back (best effort)
    conn = op.get_bind()
    
    # Recreate activity progress from session attempts
    conn.execute(text("""
        INSERT INTO activity_progress (activity_id, vocabulary_id, correct_count, attempt_count, last_attempt, success_rate)
        SELECT s.activity_id, sa.vocabulary_id,
               SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END),
               COUNT(*),
               MAX(sa.created_at),
               CAST(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)
        FROM session_attempts sa
        JOIN sessions s ON s.id = sa.session_id
        GROUP BY s.activity_id, sa.vocabulary_id
    """))

    # Update session statistics
    conn.execute(text("""
        UPDATE sessions
        SET correct_count = (
            SELECT COUNT(*) 
            FROM session_attempts 
            WHERE session_id = sessions.id AND is_correct = 1
        ),
        incorrect_count = (
            SELECT COUNT(*) 
            FROM session_attempts 
            WHERE session_id = sessions.id AND is_correct = 0
        ),
        success_rate = (
            SELECT CAST(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)
            FROM session_attempts
            WHERE session_id = sessions.id
        )
    """))

    # Drop new tables
    op.drop_table('session_attempts')
    op.drop_table('activity_vocabulary')

    # Drop created_at from sessions
    with op.batch_alter_table('sessions') as batch_op:
        batch_op.drop_column('created_at') 