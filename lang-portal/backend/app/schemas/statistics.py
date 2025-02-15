from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class VocabularyStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    vocabulary_id: int
    word: str
    translation: str
    correct_attempts: int
    incorrect_attempts: int
    success_rate: float
    mastered: bool
    last_reviewed: Optional[datetime]

class GroupStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    group_id: int
    name: str
    total_vocabulary: int
    mastered_vocabulary: int
    completion_rate: float
    average_success_rate: float

class RecentActivity(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    vocabulary_id: int
    word: str
    success_rate: float
    last_reviewed: datetime

class OverallStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    total_vocabulary: int
    vocabulary_started: int
    vocabulary_mastered: int
    completion_rate: float
    average_success_rate: float
    recent_activity: List[RecentActivity] 