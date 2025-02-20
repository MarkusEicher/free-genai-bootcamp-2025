"""optimize session models

Revision ID: 005
Revises: 004
Create Date: 2024-03-21 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to sessions table
    with op.batch_alter_table('sessions') as batch_op:
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('correct_count', sa.Integer(), server_default='0'))
        batch_op.add_column(sa.Column('incorrect_count', sa.Integer(), server_default='0'))
        batch_op.add_column(sa.Column('success_rate', sa.Float(), server_default='0.0'))
        batch_op.create_index('ix_sessions_created_at', ['created_at'])

    # Add new index to session_attempts table
    with op.batch_alter_table('session_attempts') as batch_op:
        batch_op.create_index('ix_session_attempts_response_time', ['response_time_ms'])

    # Update cached metrics for existing sessions
    conn = op.get_bind()
    
    # Update correct_count, incorrect_count, and success_rate for each session
    conn.execute(text("""
        WITH attempt_stats AS (
            SELECT 
                session_id,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
                SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as incorrect_count,
                CAST(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS FLOAT) / 
                    NULLIF(COUNT(*), 0) as success_rate
            FROM session_attempts
            GROUP BY session_id
        )
        UPDATE sessions
        SET 
            correct_count = COALESCE(attempt_stats.correct_count, 0),
            incorrect_count = COALESCE(attempt_stats.incorrect_count, 0),
            success_rate = COALESCE(attempt_stats.success_rate, 0.0)
        FROM attempt_stats
        WHERE sessions.id = attempt_stats.session_id
    """))

def downgrade():
    # Remove new columns from sessions table
    with op.batch_alter_table('sessions') as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('correct_count')
        batch_op.drop_column('incorrect_count')
        batch_op.drop_column('success_rate')
        batch_op.drop_index('ix_sessions_created_at')

    # Remove new index from session_attempts table
    with op.batch_alter_table('session_attempts') as batch_op:
        batch_op.drop_index('ix_session_attempts_response_time') 