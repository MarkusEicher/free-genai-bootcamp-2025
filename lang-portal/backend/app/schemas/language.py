from pydantic import BaseModel, ConfigDict

class LanguageBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    code: str
    name: str

class LanguageCreate(LanguageBase):
    pass

class Language(LanguageBase):
    id: int

class LanguagePairBase(BaseModel):
    source_language_id: int
    target_language_id: int

class LanguagePairCreate(LanguagePairBase):
    pass

class LanguagePair(LanguagePairBase):
    id: int
    source_language: Language
    target_language: Language

    class Config:
        from_attributes = True 