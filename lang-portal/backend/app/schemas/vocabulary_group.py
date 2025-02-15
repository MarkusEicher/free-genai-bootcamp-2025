from pydantic import BaseModel
from typing import List, Optional, ForwardRef
from datetime import datetime
from .language import LanguagePair

# Forward reference for circular imports
VocabularyInDB = ForwardRef('VocabularyInDB')

class VocabularyGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    language_pair_id: int

class VocabularyGroupCreate(VocabularyGroupBase):
    pass

class VocabularyGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class VocabularyGroup(VocabularyGroupBase):
    id: int
    language_pair: LanguagePair

    class Config:
        from_attributes = True

class VocabularyGroupWithVocabularies(VocabularyGroup):
    vocabularies: List[VocabularyInDB] = []

# Import at the end to avoid circular import issues
from app.schemas.vocabulary import VocabularyInDB
VocabularyGroupWithVocabularies.model_rebuild() 