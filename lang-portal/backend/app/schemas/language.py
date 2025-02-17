from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class LanguageBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=2)
    name: str = Field(..., min_length=1)

class LanguageCreate(LanguageBase):
    pass

class LanguageUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=2)
    name: Optional[str] = Field(None, min_length=1)

class Language(LanguageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int

class LanguagePairBase(BaseModel):
    source_language_id: int = Field(..., gt=0)
    target_language_id: int = Field(..., gt=0)

class LanguagePairCreate(LanguagePairBase):
    pass

class LanguagePair(LanguagePairBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    source_language: Language
    target_language: Language