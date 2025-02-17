from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from .vocabulary import VocabularyRead

class VocabularyGroupBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    language_pair_id: int = Field(..., gt=0)

class VocabularyGroupCreate(VocabularyGroupBase):
    pass

class VocabularyGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    language_pair_id: Optional[int] = Field(None, gt=0)

class VocabularyGroupRead(VocabularyGroupBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    vocabularies: List[VocabularyRead] = []

class VocabularyGroupWithVocabularies(VocabularyGroupRead):
    model_config = ConfigDict(from_attributes=True)
    
    total_vocabularies: int = 0
    mastered_vocabularies: int = 0
    average_success_rate: float = 0.0