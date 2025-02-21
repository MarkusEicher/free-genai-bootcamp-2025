"""remove activity vocabulary relationship

Revision ID: 004
Revises: 003
Create Date: 2024-03-21 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    # Create temporary table to store activity-vocabulary relationships
    op.create_table(
        'temp_activity_vocab',
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('vocabulary_id', sa.Integer(), nullable=False)
    )
    
    # Only try to copy data if the table exists
    if 'activity_vocabulary' in tables:
        # Copy existing relationships to temporary table
        op.execute("""
            INSERT INTO temp_activity_vocab (activity_id, vocabulary_id)
            SELECT DISTINCT activity_id, vocabulary_id
            FROM activity_vocabulary
        """)
        
        # For each activity-vocabulary pair, ensure there's a group
        # Create groups for activities that don't have them
        conn.execute(text("""
            INSERT INTO vocabulary_groups (name, description, language_pair_id, created_at)
            SELECT 
                'Activity ' || a.id || ' Group',
                'Auto-generated group for activity ' || a.id,
                v.language_pair_id,
                CURRENT_TIMESTAMP
            FROM activities a
            JOIN temp_activity_vocab tav ON tav.activity_id = a.id
            JOIN vocabularies v ON v.id = tav.vocabulary_id
            LEFT JOIN activity_vocabulary_group avg ON avg.activity_id = a.id
            WHERE avg.activity_id IS NULL
            GROUP BY a.id, v.language_pair_id
        """))
        
        # Associate vocabularies with groups
        conn.execute(text("""
            INSERT INTO vocabulary_group_association (vocabulary_id, group_id)
            SELECT DISTINCT 
                tav.vocabulary_id,
                vg.id
            FROM temp_activity_vocab tav
            JOIN activities a ON a.id = tav.activity_id
            JOIN vocabulary_groups vg ON vg.name = 'Activity ' || a.id || ' Group'
            LEFT JOIN vocabulary_group_association vga 
                ON vga.vocabulary_id = tav.vocabulary_id 
                AND vga.group_id = vg.id
            WHERE vga.vocabulary_id IS NULL
        """))
        
        # Associate activities with groups
        conn.execute(text("""
            INSERT INTO activity_vocabulary_group (activity_id, group_id, created_at)
            SELECT DISTINCT 
                a.id,
                vg.id,
                CURRENT_TIMESTAMP
            FROM activities a
            JOIN vocabulary_groups vg ON vg.name = 'Activity ' || a.id || ' Group'
            LEFT JOIN activity_vocabulary_group avg 
                ON avg.activity_id = a.id 
                AND avg.group_id = vg.id
            WHERE avg.activity_id IS NULL
        """))
    
    # Drop old tables
    op.drop_table('temp_activity_vocab')
    if 'activity_vocabulary' in tables:
        op.drop_table('activity_vocabulary')

def downgrade():
    # Create activity_vocabulary table
    op.create_table(
        'activity_vocabulary',
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('vocabulary_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['activities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vocabulary_id'], ['vocabularies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('activity_id', 'vocabulary_id')
    )
    
    # Recreate activity-vocabulary relationships from groups
    conn = op.get_bind()
    conn.execute(text("""
        INSERT INTO activity_vocabulary (activity_id, vocabulary_id)
        SELECT DISTINCT avg.activity_id, vga.vocabulary_id
        FROM activity_vocabulary_group avg
        JOIN vocabulary_group_association vga ON vga.group_id = avg.group_id
    """))
    
    # Note: We keep the vocabulary groups as they might be used for other purposes