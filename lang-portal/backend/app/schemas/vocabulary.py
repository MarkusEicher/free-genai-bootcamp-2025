from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Generic, TypeVar
from datetime import datetime
from app.schemas.language_pair import LanguagePair
from pydantic import field_validator

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class VocabularyBase(BaseModel):
    word: str = Field(..., min_length=1, description="The vocabulary word in the source language")
    translation: str = Field(..., min_length=1, description="The translation in the target language")
    language_pair_id: int = Field(..., gt=0, description="ID of the language pair this vocabulary belongs to")

class VocabularyCreate(VocabularyBase):
    pass

class VocabularyUpdate(BaseModel):
    word: Optional[str] = Field(None, min_length=1)
    translation: Optional[str] = Field(None, min_length=1)
    language_pair_id: Optional[int] = Field(None, gt=0)

class VocabularyRead(VocabularyBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    success_rate: float = 0.0
    language_pair: Optional[LanguagePair] = None

    @field_validator('language_pair', mode='before')
    @classmethod
    def validate_language_pair(cls, v):
        if v is None:
            return None
        return v

class VocabularyInDB(VocabularyRead):
    pass

class VocabularyWithGroups(VocabularyRead):
    group_ids: List[int] = []

class VocabularyListResponse(PaginatedResponse[VocabularyRead]):
    pass

class VocabularyError(BaseModel):
    detail: str
    code: str = Field(..., description="Error code for client-side error handling")

class DuplicateVocabularyError(VocabularyError):
    code: str = "duplicate_vocabulary"
    word: str
    language_pair_id: int