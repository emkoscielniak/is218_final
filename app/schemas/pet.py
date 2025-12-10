from pydantic import BaseModel, field_validator, Field
from typing import Optional
from datetime import datetime

class PetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: str = Field(..., min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=50)
    weight: Optional[float] = Field(None, gt=0, le=500)
    medical_notes: Optional[str] = None

    @field_validator("species")
    @classmethod
    def species_must_be_valid(cls, v):
        allowed = {"dog", "cat", "bird", "fish", "rabbit", "hamster", "guinea pig", "reptile", "other"}
        if v.lower() not in allowed:
            raise ValueError(f"species must be one of {allowed}")
        return v.lower()

class PetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    species: Optional[str] = Field(None, min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=50)
    weight: Optional[float] = Field(None, gt=0, le=500)
    medical_notes: Optional[str] = None
    ai_care_tips: Optional[str] = None

    @field_validator("species")
    @classmethod
    def species_must_be_valid(cls, v):
        if v is not None:
            allowed = {"dog", "cat", "bird", "fish", "rabbit", "hamster", "guinea pig", "reptile", "other"}
            if v.lower() not in allowed:
                raise ValueError(f"species must be one of {allowed}")
            return v.lower()
        return v

class PetRead(BaseModel):
    id: int
    name: str
    species: str
    breed: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    medical_notes: Optional[str] = None
    ai_care_tips: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
