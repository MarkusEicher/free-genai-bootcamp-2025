from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import uuid

router = APIRouter()

class SessionCreate(BaseModel):
    type: str
    wordIds: List[int]

@router.get("/")
async def get_sessions():
    """Get all sessions."""
    return []

@router.post("/")
async def create_session(session: SessionCreate):
    """Create a new session with minimal data."""
    session_data = {
        "id": str(uuid.uuid4()),
        "type": session.type,
        "wordIds": session.wordIds
    }
    return session_data 