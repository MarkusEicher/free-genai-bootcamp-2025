from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime
from app.schemas.progress import VocabularyProgressRead

class VocabularyStats(BaseModel):
    vocabulary_id: int
    word: str
    translation: str
    correct_attempts: int
    incorrect_attempts: int
    success_rate: float
    mastered: bool
    last_reviewed: Optional[datetime] = None

class GroupStats(BaseModel):
    group_id: int
    name: str
    total_vocabulary: int
    mastered_vocabulary: int
    completion_rate: float
    average_success_rate: float
    vocabularies_by_status: dict[str, int]

class RecentActivity(BaseModel):
    vocabulary_id: int
    word: str
    success_rate: float
    last_reviewed: datetime

class OverallStats(BaseModel):
    total_vocabularies: int
    total_mastered: int
    average_success_rate: float
    total_reviews: int

class UserStatistics(BaseModel):
    total_vocabularies: int
    total_reviews: int
    correct_reviews: int
    incorrect_reviews: int
    mastered_count: int
    average_success_rate: float

class LanguagePairStatistics(BaseModel):
    pair_id: int
    source_language: str
    target_language: str
    total_vocabularies: int
    mastered_vocabulary: int
    average_success_rate: float
    vocabularies_by_status: Dict[str, int]
    recent_activity: List[RecentActivity]

class VocabularyGroupStatistics(BaseModel):
    group_id: int
    total_vocabularies: int
    mastered_vocabularies: int
    completion_rate: float
    average_success_rate: float
    recent_activity: List[VocabularyProgressRead] = []

    model_config = {
        "from_attributes": True
    }