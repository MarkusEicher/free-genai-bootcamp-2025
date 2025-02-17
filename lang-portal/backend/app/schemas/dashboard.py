from datetime import datetime
from pydantic import BaseModel, Field

class StudyStreak(BaseModel):
    current_streak: int = Field(..., description="Current consecutive days of study")
    longest_streak: int = Field(..., description="Longest study streak achieved")

class DashboardStats(BaseModel):
    success_rate: float = Field(..., ge=0, le=1, description="Overall success rate across all activities")
    study_sessions_count: int = Field(..., ge=0, description="Total number of study sessions")
    active_activities_count: int = Field(..., ge=0, description="Number of active activities")
    study_streak: StudyStreak = Field(..., description="Current and longest study streaks")

class DashboardProgress(BaseModel):
    total_items: int = Field(..., ge=0, description="Total number of vocabulary items")
    studied_items: int = Field(..., ge=0, description="Number of items studied at least once")
    mastered_items: int = Field(..., ge=0, description="Number of items mastered (success rate > 80%)")
    progress_percentage: float = Field(..., ge=0, le=100, description="Overall progress percentage")

class LatestSession(BaseModel):
    activity_name: str = Field(..., description="Name of the activity")
    activity_type: str = Field(..., description="Type of activity (flashcard, quiz, etc.)")
    start_time: datetime = Field(..., description="Session start time")
    end_time: datetime | None = Field(None, description="Session end time")
    success_rate: float = Field(..., ge=0, le=1, description="Session success rate")
    correct_count: int = Field(..., ge=0, description="Number of correct answers")
    incorrect_count: int = Field(..., ge=0, description="Number of incorrect answers") 