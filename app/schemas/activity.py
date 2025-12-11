from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ActivityCreate(BaseModel):
    pet_id: int
    activity_type: str = Field(..., pattern="^(walk|feeding|medication|vet_visit|grooming|play|training|other)$")
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0, description="Duration in minutes")
    distance: Optional[float] = Field(None, ge=0, description="Distance in miles")
    notes: Optional[str] = None
    activity_date: datetime = Field(default_factory=datetime.utcnow)

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
    activity_type: Optional[str] = Field(None, pattern="^(walk|feeding|medication|vet_visit|grooming|play|training|other)$")
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    duration: Optional[int] = Field(None, ge=0)
    distance: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    activity_date: Optional[datetime] = None

    class Config:
        from_attributes = True
