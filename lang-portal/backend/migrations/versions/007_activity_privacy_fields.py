"""activity privacy fields

Revision ID: 007
Revises: 006
Create Date: 2024-03-21 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None

def upgrade():
    # Add privacy-focused fields to activities table
    with op.batch_alter_table('activities') as batch_op:
        batch_op.add_column(sa.Column('privacy_level', sa.String(), 
                                    server_default='private', nullable=False))
        batch_op.add_column(sa.Column('retention_days', sa.Integer(), 
                                    server_default='30', nullable=False))
        batch_op.add_column(sa.Column('local_storage_path', sa.String(), 
                                    nullable=True))
        batch_op.add_column(sa.Column('requires_sync', sa.Boolean(), 
                                    server_default='false', nullable=False))
        batch_op.add_column(sa.Column('last_accessed_at', sa.DateTime(timezone=True), 
                                    nullable=True))
        batch_op.add_column(sa.Column('scheduled_deletion_at', sa.DateTime(timezone=True), 
                                    nullable=True))
        
        # Add index for privacy_level
        batch_op.create_index('ix_activities_privacy_level', ['privacy_level'])

def downgrade():
    # Remove privacy-focused fields from activities table
    with op.batch_alter_table('activities') as batch_op:
        batch_op.drop_index('ix_activities_privacy_level')
        batch_op.drop_column('scheduled_deletion_at')
        batch_op.drop_column('last_accessed_at')
        batch_op.drop_column('requires_sync')
        batch_op.drop_column('local_storage_path')
        batch_op.drop_column('retention_days')
        batch_op.drop_column('privacy_level') 