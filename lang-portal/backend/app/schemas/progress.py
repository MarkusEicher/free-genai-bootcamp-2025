from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VocabularyProgressBase(BaseModel):
    vocabulary_id: int
    correct_attempts: int = 0
    incorrect_attempts: int = 0
    mastered: bool = False

class VocabularyProgressCreate(VocabularyProgressBase):
    pass

class VocabularyProgress(VocabularyProgressBase):
    id: int
    last_reviewed: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    success_rate: float

    class Config:
        from_attributes = True

class ProgressUpdate(BaseModel):
    correct: bool 