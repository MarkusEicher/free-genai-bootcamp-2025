# Activity-Vocabulary Relationship Change Plan

## Overview

Restructure the relationship between Activities and Vocabulary items to work exclusively through VocabularyGroups. Key points:
- VocabularyGroups are independent entities that can exist without activities
- Activities must use one or more VocabularyGroups
- No direct Activity-Vocabulary associations
- Development phase changes without data migration concerns
- Maintain current vocabulary/language pair structure with enhanced practice capabilities

## Current State

```python
# Current relationships
Activity <-> Vocabulary (many-to-many through activity_vocabulary)
VocabularyGroup <-> Vocabulary (many-to-many through vocabulary_group_association)
```

## Implementation Details

### 1. Database Migration

```python
"""Restructure activity vocabulary relationships

Revision ID: {timestamp}_restructure_activity_vocab
Revises: {previous_revision}
"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime

def upgrade():
    # Create new association table
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
    
    # Add practice direction to activities
    op.add_column('activities',
        sa.Column('practice_direction', sa.String(), 
                 server_default='forward', nullable=False)
    )
    
    # Create indexes for performance
    op.create_index('ix_activity_vocabulary_group_activity_id', 
                   'activity_vocabulary_group', ['activity_id'])
    op.create_index('ix_activity_vocabulary_group_group_id', 
                   'activity_vocabulary_group', ['group_id'])
    
    # Drop old association table
    op.drop_table('activity_vocabulary')

def downgrade():
    # Recreate old association table
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
    
    # Drop new tables/columns
    op.drop_column('activities', 'practice_direction')
    op.drop_table('activity_vocabulary_group')
```

### 2. API Specifications

#### VocabularyGroup Endpoints

```python
@router.get("/vocabulary-groups", response_model=List[VocabularyGroupResponse])
async def list_vocabulary_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    language_pair_id: Optional[int] = None
):
    """
    List vocabulary groups with pagination.
    
    Returns:
        List[VocabularyGroupResponse]: List of vocabulary groups
    """

@router.post("/vocabulary-groups", response_model=VocabularyGroupResponse)
async def create_vocabulary_group(
    group: VocabularyGroupCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new vocabulary group.
    
    Args:
        group (VocabularyGroupCreate): Group creation data
        
    Returns:
        VocabularyGroupResponse: Created group
    """

@router.get("/vocabulary-groups/{group_id}/practice")
async def get_practice_items(
    group_id: int,
    reverse: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get practice items for a group.
    
    Args:
        group_id (int): Group ID
        reverse (bool): If True, swap word and translation
        
    Returns:
        List[PracticeItem]: List of practice items
    """
```

#### Activity Endpoints

```python
@router.post("/activities", response_model=ActivityResponse)
async def create_activity(
    activity: ActivityCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new activity with vocabulary groups.
    
    Args:
        activity (ActivityCreate): Activity creation data including:
            - name: str
            - type: str
            - description: str
            - vocabulary_group_ids: List[int]
            - practice_direction: str = "forward"
            
    Returns:
        ActivityResponse: Created activity
    """

@router.get("/activities/{activity_id}", response_model=ActivityDetailResponse)
async def get_activity(
    activity_id: int,
    db: Session = Depends(get_db)
):
    """
    Get activity details including practice vocabulary.
    
    Returns:
        ActivityDetailResponse: Activity details including:
            - Basic activity info
            - Associated groups
            - Practice vocabulary in correct direction
    """
```

### 2.1 Error Handling Specifications

#### Standard Error Responses
```python
class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

# Common error responses
VOCABULARY_GROUP_NOT_FOUND = ErrorResponse(
    code="VOCABULARY_GROUP_NOT_FOUND",
    message="Vocabulary group not found"
)

ACTIVITY_NOT_FOUND = ErrorResponse(
    code="ACTIVITY_NOT_FOUND",
    message="Activity not found"
)

INVALID_PRACTICE_DIRECTION = ErrorResponse(
    code="INVALID_PRACTICE_DIRECTION",
    message="Practice direction must be 'forward' or 'reverse'"
)

EMPTY_GROUP_IDS = ErrorResponse(
    code="EMPTY_GROUP_IDS",
    message="At least one vocabulary group must be specified"
)

INVALID_LANGUAGE_PAIR = ErrorResponse(
    code="INVALID_LANGUAGE_PAIR",
    message="Invalid language pair for vocabulary group"
)
```

#### Error Handling in Endpoints
```python
@router.post("/activities")
async def create_activity(
    activity: ActivityCreate,
    db: Session = Depends(get_db)
):
    """Create new activity with error handling."""
    if not activity.vocabulary_group_ids:
        raise HTTPException(
            status_code=400,
            detail=EMPTY_GROUP_IDS.dict()
        )
    
    # Verify all groups exist
    groups = db.query(VocabularyGroup).filter(
        VocabularyGroup.id.in_(activity.vocabulary_group_ids)
    ).all()
    
    if len(groups) != len(activity.vocabulary_group_ids):
        raise HTTPException(
            status_code=404,
            detail=VOCABULARY_GROUP_NOT_FOUND.dict()
        )
    
    # Verify practice direction
    if activity.practice_direction not in ["forward", "reverse"]:
        raise HTTPException(
            status_code=400,
            detail=INVALID_PRACTICE_DIRECTION.dict()
        )
    
    try:
        return activity_service.create(db, activity)
    except Exception as e:
        logger.error(f"Failed to create activity: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to create activity"}
        )
```

### 2.2 Response Examples

#### Successful Responses

```python
# GET /api/v1/vocabulary-groups
{
    "items": [
        {
            "id": 1,
            "name": "Basic Verbs",
            "description": "Common verbs for beginners",
            "language_pair_id": 1,
            "created_at": "2024-02-18T10:00:00Z",
            "updated_at": "2024-02-18T10:00:00Z"
        }
    ],
    "total": 1,
    "page": 1,
    "size": 10
}

# GET /api/v1/vocabulary-groups/{id}/practice
{
    "items": [
        {
            "word": "cat",
            "translation": "Katze",
            "vocabulary_id": 1,
            "language_pair_id": 1
        }
    ],
    "group_id": 1,
    "language_pair": {
        "source": "en",
        "target": "de"
    }
}

# POST /api/v1/activities Response
{
    "id": 1,
    "name": "Daily Practice",
    "type": "flashcard",
    "description": "Practice session",
    "practice_direction": "forward",
    "vocabulary_groups": [
        {
            "id": 1,
            "name": "Basic Verbs"
        }
    ],
    "created_at": "2024-02-18T10:00:00Z"
}
```

#### Error Responses

```python
# 404 Not Found
{
    "code": "VOCABULARY_GROUP_NOT_FOUND",
    "message": "Vocabulary group not found"
}

# 400 Bad Request
{
    "code": "INVALID_PRACTICE_DIRECTION",
    "message": "Practice direction must be 'forward' or 'reverse'"
}

# 500 Internal Server Error
{
    "code": "INTERNAL_ERROR",
    "message": "Failed to create activity"
}
```

### 2.3 Cache Handling

```python
@cache_response(prefix="vocabulary_group", expire=300)
async def get_vocabulary_group(group_id: int):
    """Cached vocabulary group retrieval."""
    
@cache_response(prefix="activity", expire=300)
async def get_activity_details(activity_id: int):
    """Cached activity details retrieval."""

# Cache invalidation on updates
def invalidate_activity_cache(activity_id: int):
    """Invalidate activity-related caches."""
    cache_patterns = [
        f"activity:{activity_id}*",
        "dashboard:stats*"
    ]
    for pattern in cache_patterns:
        invalidate_cache_pattern(pattern)
```

### 3. Pydantic Schemas

```python
class VocabularyGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    language_pair_id: int

class VocabularyGroupCreate(VocabularyGroupBase):
    pass

class VocabularyGroupResponse(VocabularyGroupBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class ActivityCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    vocabulary_group_ids: List[int]
    practice_direction: str = "forward"
    
    @validator("practice_direction")
    def validate_direction(cls, v):
        if v not in ["forward", "reverse"]:
            raise ValueError("practice_direction must be 'forward' or 'reverse'")
        return v

class PracticeItem(BaseModel):
    word: str
    translation: str
    vocabulary_id: int
    language_pair_id: int
```

### 4. Test Coverage Requirements

#### Unit Tests

```python
# test_vocabulary_group.py
def test_vocabulary_group_creation(db_session):
    """Test creating a vocabulary group."""
    
def test_vocabulary_group_practice_items(db_session):
    """Test getting practice items in both directions."""
    
def test_vocabulary_group_with_multiple_vocabularies(db_session):
    """Test group with multiple vocabulary items."""

# test_activity.py
def test_activity_creation_with_groups(db_session):
    """Test creating activity with vocabulary groups."""
    
def test_activity_practice_direction(db_session):
    """Test activity practice direction handling."""
    
def test_activity_with_multiple_groups(db_session):
    """Test activity with multiple vocabulary groups."""

# test_practice.py
def test_forward_practice_items(db_session):
    """Test getting forward practice items."""
    
def test_reverse_practice_items(db_session):
    """Test getting reverse practice items."""
    
def test_practice_items_ordering(db_session):
    """Test practice items maintain consistent order."""
```

#### Integration Tests

```python
# test_vocabulary_group_api.py
def test_vocabulary_group_endpoints(client):
    """Test all vocabulary group endpoints."""
    
def test_practice_endpoints(client):
    """Test practice-related endpoints."""

# test_activity_api.py
def test_activity_creation_api(client):
    """Test activity creation with groups."""
    
def test_activity_practice_api(client):
    """Test activity practice endpoints."""
```

#### Performance Tests

```python
# test_performance.py
def test_practice_items_large_group(client, db_session):
    """Test performance with large vocabulary groups."""
    
def test_multiple_groups_performance(client, db_session):
    """Test performance with multiple groups."""
    
def test_concurrent_practice_requests(client, db_session):
    """Test concurrent practice session handling."""
```

### 5. Required Test Coverage

- Models: 95% coverage
  - All model methods
  - All property getters
  - Relationship handling
  
- API Endpoints: 90% coverage
  - All success paths
  - Error handling
  - Input validation
  
- Service Layer: 95% coverage
  - Business logic
  - Data transformation
  - Error cases
  
- Integration: 85% coverage
  - End-to-end flows
  - Database interactions
  - Cache handling

## Required Changes

### 1. Model Structure

#### VocabularyGroup Model (Independent Entity)
```python
class VocabularyGroup(Base):
    id: Integer
    name: String
    description: String
    language_pair_id: ForeignKey(LanguagePair)
    created_at: DateTime
    updated_at: DateTime
    
    # Relationships
    vocabularies = relationship(
        "Vocabulary",
        secondary=vocabulary_group_association,
        back_populates="groups"
    )
    
    # Helper method for practice
    def get_practice_items(self, reverse: bool = False) -> List[Dict]:
        """
        Get vocabulary items for practice, optionally in reverse direction.
        
        Args:
            reverse (bool): If True, swap word and translation
        
        Returns:
            List of dictionaries containing practice items
        """
        items = []
        for vocab in self.vocabularies:
            items.append({
                "word": vocab.translation if reverse else vocab.word,
                "translation": vocab.word if reverse else vocab.translation,
                "vocabulary_id": vocab.id,
                "language_pair_id": vocab.language_pair_id
            })
        return items
```

#### Activity Model (Depends on VocabularyGroups)
```python
class Activity(Base):
    id: Integer
    type: String
    name: String
    description: String
    created_at: DateTime
    practice_direction: String = Column(String, default="forward")  # New field
    
    # New relationship
    vocabulary_groups = relationship(
        "VocabularyGroup",
        secondary="activity_vocabulary_group",
        back_populates="activities"
    )
    
    def get_practice_vocabulary(self) -> List[Dict]:
        """Get vocabulary items in correct practice direction."""
        items = []
        reverse = self.practice_direction == "reverse"
        for group in self.vocabulary_groups:
            items.extend(group.get_practice_items(reverse=reverse))
        return items
```

### 2. Database Changes

```sql
-- Remove old association
DROP TABLE IF EXISTS activity_vocabulary;

-- Add new association
CREATE TABLE activity_vocabulary_group (
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES vocabulary_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (activity_id, group_id)
);

-- Add practice direction to activities
ALTER TABLE activities ADD COLUMN practice_direction VARCHAR DEFAULT 'forward';
```

### 3. API Endpoint Updates

#### VocabularyGroup Endpoints (Independent)
```python
# Existing/Updated endpoints
GET /api/v1/vocabulary-groups          # List all groups
POST /api/v1/vocabulary-groups         # Create new group
GET /api/v1/vocabulary-groups/{id}     # Get group details
PUT /api/v1/vocabulary-groups/{id}     # Update group
DELETE /api/v1/vocabulary-groups/{id}  # Delete group

# Vocabulary management in groups
POST /api/v1/vocabulary-groups/{id}/vocabularies      # Add vocabularies
DELETE /api/v1/vocabulary-groups/{id}/vocabularies    # Remove vocabularies

# New practice endpoints
GET /api/v1/vocabulary-groups/{id}/practice          # Get practice items
GET /api/v1/vocabulary-groups/{id}/practice/reverse  # Get reverse practice items
```

#### Activity Endpoints (Uses Groups)
```python
# Modified endpoints
POST /api/v1/activities
{
    "name": "string",
    "type": "string",
    "description": "string",
    "vocabulary_group_ids": ["int"],  # Required: at least one group
    "practice_direction": "forward"    # Optional: "forward" or "reverse"
}

GET /api/v1/activities/{id}
# Returns activity with associated groups and their vocabularies in correct practice direction
```

### 4. Implementation Steps

1. **Model Updates**
   - Remove activity_vocabulary table and relationships
   - Add activity_vocabulary_group table and relationships
   - Update model classes with new relationships
   - Add practice direction and helper methods

2. **API Layer**
   - Update activity creation/update to require vocabulary_group_ids
   - Add practice direction support
   - Modify activity retrieval to include vocabulary through groups
   - Ensure VocabularyGroup endpoints support independent management
   - Add practice-specific endpoints

3. **Service Layer**
   - Update ActivityService to work with vocabulary groups
   - Ensure VocabularyGroupService supports independent operations
   - Update session/attempt handling for group context
   - Implement practice direction logic

4. **Testing Focus**
   - VocabularyGroup independent CRUD operations
   - Activity creation with multiple groups
   - Session creation and attempt recording
   - API response structure validation
   - Practice direction functionality
   - Reverse practice validation

### 5. Validation Checklist

- [x] VocabularyGroups can be managed independently
- [x] Activities require at least one VocabularyGroup
- [x] Session attempts correctly track progress
- [x] API documentation reflects new structure
- [x] Practice direction works correctly
- [x] Reverse practice produces correct word/translation pairs
- [x] All tests pass with new relationships

### 6. Timeline

1. Model and Database Changes: 1 day
2. API and Service Updates: 1-2 days
3. Testing and Validation: 1 day

Total: 3-4 days

Task completed: 2025-02-19