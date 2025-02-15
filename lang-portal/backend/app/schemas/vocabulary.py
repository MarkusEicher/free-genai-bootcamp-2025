from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from .language_pair import LanguagePair

class VocabularyBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    word: str
    translation: str
    language_pair_id: int

class VocabularyCreate(VocabularyBase):
    pass

class VocabularyUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    word: Optional[str] = None
    translation: Optional[str] = None

class Vocabulary(VocabularyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

class VocabularyInDB(Vocabulary):
    language_pair: LanguagePair
    success_rate: Optional[float] = 0.0 