from pydantic import BaseModel, constr

class LanguageBase(BaseModel):
    code: constr(min_length=2, max_length=2)  # ISO 639-1 code
    name: str

class LanguageCreate(LanguageBase):
    pass

class Language(LanguageBase):
    id: int

    class Config:
        from_attributes = True

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