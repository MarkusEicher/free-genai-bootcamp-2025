from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.database import get_db
from app.services.vocabulary_group import vocabulary_group_service
from app.schemas.vocabulary_group import (
    VocabularyGroupCreate,
    VocabularyGroupUpdate,
    VocabularyGroupResponse,
    VocabularyGroupDetail,
    PracticeItem
)
from app.core.cache import cache_response

router = APIRouter()

@router.post(
    "/vocabulary-groups",
    response_model=VocabularyGroupResponse,
    summary="Create Vocabulary Group",
    description="Create a new vocabulary group that can be used in activities",
    responses={
        200: {
            "description": "Vocabulary group created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "name": "Basic Verbs",
                        "description": "Common verbs for beginners",
                        "language_pair_id": 1,
                        "vocabulary_count": 0,
                        "created_at": "2024-03-21T10:00:00Z"
                    }
                }
            }
        },
        400: {
            "description": "Invalid data",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Language pair not found"
                    }
                }
            }
        }
    }
)
def create_vocabulary_group(
    group: VocabularyGroupCreate,
    db: Session = Depends(get_db)
):
    return vocabulary_group_service.create(db, obj_in=group)

@router.get(
    "/vocabulary-groups",
    response_model=List[VocabularyGroupResponse],
    summary="List Vocabulary Groups",
    description="List all vocabulary groups with optional language pair filtering",
    responses={
        200: {
            "description": "List of vocabulary groups",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "name": "Basic Verbs",
                            "description": "Common verbs for beginners",
                            "language_pair_id": 1,
                            "vocabulary_count": 10,
                            "created_at": "2024-03-21T10:00:00Z"
                        }
                    ]
                }
            }
        }
    }
)
def list_vocabulary_groups(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    language_pair_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return vocabulary_group_service.get_multi(
        db, skip=skip, limit=limit, language_pair_id=language_pair_id
    )

@router.get(
    "/vocabulary-groups/{group_id}",
    response_model=VocabularyGroupDetail,
    summary="Get Vocabulary Group Details",
    description="Get detailed information about a vocabulary group including its vocabularies and activities",
    responses={
        200: {
            "description": "Vocabulary group details",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "name": "Basic Verbs",
                        "description": "Common verbs for beginners",
                        "language_pair_id": 1,
                        "vocabulary_count": 10,
                        "created_at": "2024-03-21T10:00:00Z",
                        "vocabularies": [
                            {
                                "id": 1,
                                "word": "run",
                                "translation": "laufen"
                            }
                        ],
                        "activities": [
                            {
                                "id": 1,
                                "name": "Daily Practice",
                                "type": "flashcard"
                            }
                        ]
                    }
                }
            }
        },
        404: {
            "description": "Group not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Vocabulary group not found"
                    }
                }
            }
        }
    }
)
def get_vocabulary_group(
    group_id: int,
    db: Session = Depends(get_db)
):
    group = vocabulary_group_service.get_with_relationships(db, id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    return group

@router.get(
    "/vocabulary-groups/{group_id}/practice",
    response_model=List[PracticeItem],
    summary="Get Practice Items",
    description="""
    Get vocabulary items for practice.
    
    Parameters:
    - reverse: If true, swap word and translation for reverse practice
    """,
    responses={
        200: {
            "description": "List of practice items",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "word": "run",
                            "translation": "laufen",
                            "vocabulary_id": 1
                        }
                    ]
                }
            }
        }
    }
)
@cache_response(prefix="vocabulary_group:practice", expire=300)
def get_practice_items(
    group_id: int,
    reverse: bool = False,
    db: Session = Depends(get_db)
):
    """Get practice items for a vocabulary group."""
    return vocabulary_group_service.get_practice_items(db, group_id=group_id, reverse=reverse)

@router.put(
    "/vocabulary-groups/{group_id}",
    response_model=VocabularyGroupResponse,
    summary="Update Vocabulary Group",
    description="Update vocabulary group details",
    responses={
        200: {
            "description": "Group updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "name": "Updated Verbs",
                        "description": "Updated description",
                        "language_pair_id": 1,
                        "vocabulary_count": 10,
                        "created_at": "2024-03-21T10:00:00Z"
                    }
                }
            }
        }
    }
)
def update_vocabulary_group(
    group_id: int,
    group_update: VocabularyGroupUpdate,
    db: Session = Depends(get_db)
):
    group = vocabulary_group_service.get(db, id=group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Vocabulary group not found")
    return vocabulary_group_service.update(db, db_obj=group, obj_in=group_update)

@router.post(
    "/vocabulary-groups/{group_id}/vocabularies",
    response_model=VocabularyGroupDetail,
    summary="Add Vocabularies to Group",
    description="Add multiple vocabulary items to a group",
    responses={
        200: {
            "description": "Vocabularies added successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "name": "Basic Verbs",
                        "vocabularies": [
                            {
                                "id": 1,
                                "word": "run",
                                "translation": "laufen"
                            }
                        ]
                    }
                }
            }
        }
    }
)
def add_vocabularies(
    group_id: int,
    vocabulary_ids: List[int],
    db: Session = Depends(get_db)
):
    try:
        return vocabulary_group_service.add_vocabularies(
            db, group_id=group_id, vocabulary_ids=vocabulary_ids
        )
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Invalid vocabulary IDs or duplicate entries"
        )

@router.delete(
    "/vocabulary-groups/{group_id}/vocabularies/{vocabulary_id}",
    response_model=VocabularyGroupDetail,
    summary="Remove Vocabulary from Group",
    description="Remove a vocabulary item from a group",
    responses={
        200: {
            "description": "Vocabulary removed successfully"
        },
        400: {
            "description": "Cannot remove - vocabulary is used in active activities",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Cannot remove vocabulary as it is used in active activities"
                    }
                }
            }
        }
    }
)
def remove_vocabulary(
    group_id: int,
    vocabulary_id: int,
    db: Session = Depends(get_db)
):
    try:
        return vocabulary_group_service.remove_vocabulary(
            db, group_id=group_id, vocabulary_id=vocabulary_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete(
    "/vocabulary-groups/{group_id}",
    summary="Delete Vocabulary Group",
    description="Delete a vocabulary group if it's not used in any activities",
    responses={
        200: {
            "description": "Group deleted successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Vocabulary group deleted successfully"
                    }
                }
            }
        },
        400: {
            "description": "Group is in use",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Cannot delete group as it is used in active activities"
                    }
                }
            }
        }
    }
)
def delete_vocabulary_group(
    group_id: int,
    db: Session = Depends(get_db)
):
    try:
        vocabulary_group_service.delete(db, id=group_id)
        return {"message": "Vocabulary group deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))