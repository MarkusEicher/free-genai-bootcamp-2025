from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from .vocabulary import VocabularyRead

class ProgressBase(BaseModel):
    vocabulary_id: int
    correct_attempts: int = Field(default=0, ge=0)
    incorrect_attempts: int = Field(default=0, ge=0)
    mastered: bool = False
    last_reviewed: Optional[datetime] = None

class ProgressCreate(ProgressBase):
    pass

class ProgressUpdate(BaseModel):
    correct_attempts: Optional[int] = Field(None, ge=0)
    incorrect_attempts: Optional[int] = Field(None, ge=0)
    mastered: Optional[bool] = None
    correct: Optional[bool] = None  # For backward compatibility

class VocabularyProgress(ProgressBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    success_rate: float = 0.0

class ProgressRead(VocabularyProgress):
    model_config = ConfigDict(from_attributes=True)
    
    vocabulary: Optional[VocabularyRead] = None

class VocabularyProgressBase(BaseModel):
    vocabulary_id: int = Field(..., gt=0)
    correct_attempts: int = Field(default=0, ge=0)
    incorrect_attempts: int = Field(default=0, ge=0)
    last_reviewed: Optional[datetime] = None
    mastered: bool = False

class VocabularyProgressCreate(VocabularyProgressBase):
    pass

class VocabularyProgressUpdate(BaseModel):
    correct_attempts: Optional[int] = Field(None, ge=0)
    incorrect_attempts: Optional[int] = Field(None, ge=0)
    last_reviewed: Optional[datetime] = None
    mastered: Optional[bool] = None

class VocabularyProgressRead(VocabularyProgressBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    @property
    def success_rate(self) -> float:
        total_attempts = self.correct_attempts + self.incorrect_attempts
        return (self.correct_attempts / total_attempts) * 100 if total_attempts > 0 else 0.0

    model_config = {
        "from_attributes": True
    }