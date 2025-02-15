from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VocabularyBase(BaseModel):
    word: str
    translation: str

class VocabularyCreate(VocabularyBase):
    pass

class VocabularyUpdate(BaseModel):
    word: Optional[str] = None
    translation: Optional[str] = None

class VocabularyInDB(VocabularyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True 