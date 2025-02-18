from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class VocabularyBrief(BaseModel):
    id: int
    word: str
    translation: str

class ActivityBrief(BaseModel):
    id: int
    name: str
    type: str

class VocabularyGroupBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the vocabulary group")
    description: Optional[str] = Field(None, description="Description of the group")
    language_pair_id: int = Field(..., description="ID of the language pair")

class VocabularyGroupCreate(VocabularyGroupBase):
    pass

class VocabularyGroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    language_pair_id: Optional[int] = None

class VocabularyGroupResponse(VocabularyGroupBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    vocabulary_count: int = Field(..., description="Number of vocabulary items in the group")
    created_at: datetime

class VocabularyGroupDetail(VocabularyGroupResponse):
    vocabularies: List[VocabularyBrief]
    activities: List[ActivityBrief]

class PracticeItem(BaseModel):
    word: str
    translation: str
    vocabulary_id: int