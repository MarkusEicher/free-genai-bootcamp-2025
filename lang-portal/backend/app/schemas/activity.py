from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ActivityBase(BaseModel):
    type: str
    name: str
    description: Optional[str] = None

class ActivityCreate(ActivityBase):
    pass

class Activity(ActivityBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SessionBase(BaseModel):
    activity_id: int
    correct_count: Optional[int] = 0
    incorrect_count: Optional[int] = 0
    success_rate: Optional[float] = 0.0

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True