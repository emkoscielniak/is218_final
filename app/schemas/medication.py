from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class MedicationCreate(BaseModel):
    pet_id: int
    name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=100)
    route: Optional[str] = Field(None, max_length=50)
    reason: Optional[str] = None
    prescribing_vet: Optional[str] = Field(None, max_length=200)
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    is_active: bool = True
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class MedicationRead(BaseModel):
    id: int
    pet_id: int
    name: str
    dosage: str
    frequency: str
    route: Optional[str]
    reason: Optional[str]
    prescribing_vet: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    is_active: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MedicationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    dosage: Optional[str] = Field(None, min_length=1, max_length=100)
    frequency: Optional[str] = Field(None, min_length=1, max_length=100)
    route: Optional[str] = Field(None, max_length=50)
    reason: Optional[str] = None
    prescribing_vet: Optional[str] = Field(None, max_length=200)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
