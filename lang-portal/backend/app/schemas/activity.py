from datetime import datetime, UTC
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, constr

class ActivityBase(BaseModel):
    type: str = Field(..., description="Type of activity (e.g., flashcard, typing, quiz)", min_length=1)
    name: constr(min_length=1) = Field(..., description="Name of the activity")
    description: Optional[str] = Field(None, description="Description of the activity")

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    type: Optional[str] = Field(None, description="Type of activity")
    name: Optional[str] = Field(None, description="Name of the activity")
    description: Optional[str] = Field(None, description="Description of the activity")

class ActivityResponse(ActivityBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime

class SessionBase(BaseModel):
    start_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    end_time: Optional[datetime] = None

class SessionCreate(SessionBase):
    pass

class SessionAttemptBase(BaseModel):
    vocabulary_id: int
    is_correct: bool
    response_time_ms: Optional[int] = None

class SessionAttemptCreate(SessionAttemptBase):
    pass

class SessionAttemptResponse(SessionAttemptBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    session_id: int
    created_at: datetime

class SessionResponse(SessionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    activity_id: int
    created_at: datetime
    attempts: List[SessionAttemptResponse] = []
    correct_count: int
    incorrect_count: int
    success_rate: float

class ActivityProgressBase(BaseModel):
    correct_count: int = Field(default=0)
    attempt_count: int = Field(default=0)
    success_rate: float = Field(default=0.0)
    last_attempt: Optional[datetime] = None

class ActivityProgressCreate(ActivityProgressBase):
    activity_id: int
    vocabulary_id: int

class ActivityProgressUpdate(BaseModel):
    correct_count: Optional[int] = None
    attempt_count: Optional[int] = None
    success_rate: Optional[float] = None
    last_attempt: Optional[datetime] = None

class ActivityProgressResponse(ActivityProgressBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    activity_id: int
    vocabulary_id: int