"""Add user and session models

Revision ID: e5fba5eb1a76
Revises: xxxxxxxxxxxx
Create Date: 2025-02-17 18:50:31.888312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5fba5eb1a76'
down_revision: Union[str, None] = 'xxxxxxxxxxxx'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create indexes for existing tables
    with op.batch_alter_table('languages', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_languages_code'), ['code'], unique=True)
        batch_op.create_index(batch_op.f('ix_languages_id'), ['id'], unique=False)

    with op.batch_alter_table('language_pairs', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_language_pairs_id'), ['id'], unique=False)

    with op.batch_alter_table('vocabularies', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_vocabularies_id'), ['id'], unique=False)

    with op.batch_alter_table('vocabulary_groups', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_vocabulary_groups_id'), ['id'], unique=False)

    with op.batch_alter_table('vocabulary_progress', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_vocabulary_progress_id'), ['id'], unique=False)


def downgrade() -> None:
    # Drop indexes
    with op.batch_alter_table('vocabulary_progress', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_vocabulary_progress_id'))

    with op.batch_alter_table('vocabulary_groups', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_vocabulary_groups_id'))

    with op.batch_alter_table('vocabularies', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_vocabularies_id'))

    with op.batch_alter_table('language_pairs', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_language_pairs_id'))

    with op.batch_alter_table('languages', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_languages_id'))
        batch_op.drop_index(batch_op.f('ix_languages_code'))
