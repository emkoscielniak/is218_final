from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ActivityCreate(BaseModel):
    pet_id: int
    activity_date: datetime  # User provides date and time
    description: str = Field(..., min_length=1, description="Description of the activity")
    
    # AI-generated fields (populated by the system)
    activity_type: Optional[str] = None
    title: Optional[str] = None
    duration: Optional[int] = None
    distance: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ActivityRead(BaseModel):
    id: int
    pet_id: int
    activity_type: str
    title: str
    description: Optional[str]
    duration: Optional[int]
    distance: Optional[float]
    notes: Optional[str]
    activity_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ActivityUpdate(BaseModel):
    activity_date: Optional[datetime] = None
    description: Optional[str] = Field(None, min_length=1)
    activity_type: Optional[str] = None
    title: Optional[str] = None
    duration: Optional[int] = None
    distance: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
