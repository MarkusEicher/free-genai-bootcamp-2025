from pydantic import BaseModel, ConfigDict

class LanguagePairBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    source_language_id: int
    target_language_id: int

class LanguagePairCreate(LanguagePairBase):
    pass

class LanguagePair(LanguagePairBase):
    id: int 