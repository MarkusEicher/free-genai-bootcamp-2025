"""initial schema

Revision ID: xxxxxxxxxxxx
Revises: 
Create Date: 2024-02-17 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'xxxxxxxxxxxx'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create languages table
    op.create_table(
        'languages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=2), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )

    # Create language_pairs table
    op.create_table(
        'language_pairs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_language_id', sa.Integer(), nullable=False),
        sa.Column('target_language_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['source_language_id'], ['languages.id'], ),
        sa.ForeignKeyConstraint(['target_language_id'], ['languages.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('source_language_id', 'target_language_id', name='unique_language_pair')
    )

    # Create vocabulary_groups table
    op.create_table(
        'vocabulary_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('language_pair_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['language_pair_id'], ['language_pairs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create vocabularies table
    op.create_table(
        'vocabularies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('word', sa.String(), nullable=False),
        sa.Column('translation', sa.String(), nullable=False),
        sa.Column('language_pair_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['language_pair_id'], ['language_pairs.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('word', 'language_pair_id', name='uix_word_language_pair')
    )

    # Create vocabulary_group_association table
    op.create_table(
        'vocabulary_group_association',
        sa.Column('vocabulary_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['vocabulary_groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('vocabulary_id', 'group_id')
    )

    # Create progress table
    op.create_table(
        'vocabulary_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('vocabulary_id', sa.Integer(), nullable=False),
        sa.Column('correct_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('incorrect_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('mastered', sa.Boolean(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('vocabulary_id')
    )

def downgrade():
    op.drop_table('vocabulary_progress')
    op.drop_table('vocabulary_group_association')
    op.drop_table('vocabularies')
    op.drop_table('vocabulary_groups')
    op.drop_table('language_pairs')
    op.drop_table('languages')