from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class VocabularyBaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    word: str
    translation: str
    language_pair_id: int

class ProgressResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    vocabulary_id: int
    correct_attempts: int
    incorrect_attempts: int
    last_reviewed: Optional[datetime]
    mastered: bool
    success_rate: float

class ProgressUpdateSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    correct: bool 