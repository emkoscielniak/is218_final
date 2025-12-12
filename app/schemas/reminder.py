from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ReminderCreate(BaseModel):
    pet_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    reminder_type: str = Field(..., pattern="^(medication|appointment|vaccination|grooming|other)$")
    reminder_date: datetime
    is_completed: bool = False

class ReminderRead(BaseModel):
    id: int
    user_id: int
    pet_id: Optional[int]
    title: str
    description: Optional[str]
    reminder_type: str
    reminder_date: datetime
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ReminderUpdate(BaseModel):
    pet_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    reminder_type: Optional[str] = Field(None, pattern="^(medication|appointment|vaccination|grooming|other)$")
    reminder_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
