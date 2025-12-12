from pydantic import BaseModel, field_validator, Field
from typing import Optional
from datetime import datetime, date

class PetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    species: str = Field(..., min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    breed_type: Optional[str] = Field(None, max_length=20)
    breed_secondary: Optional[str] = Field(None, max_length=100)
    breed_tertiary: Optional[str] = Field(None, max_length=100)
    sex: Optional[str] = Field(None, max_length=10)
    birthday: Optional[date] = None
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
    
    @field_validator("sex")
    @classmethod
    def sex_must_be_valid(cls, v):
        if v is not None:
            allowed = {"male", "female", "unknown"}
            if v.lower() not in allowed:
                raise ValueError(f"sex must be one of {allowed}")
            return v.lower()
        return v
    
    @field_validator("breed_type")
    @classmethod
    def breed_type_must_be_valid(cls, v):
        if v is not None:
            allowed = {"purebred", "mix"}
            if v.lower() not in allowed:
                raise ValueError(f"breed_type must be one of {allowed}")
            return v.lower()
        return v

class PetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    species: Optional[str] = Field(None, min_length=1, max_length=50)
    breed: Optional[str] = Field(None, max_length=100)
    breed_type: Optional[str] = Field(None, max_length=20)
    breed_secondary: Optional[str] = Field(None, max_length=100)
    breed_tertiary: Optional[str] = Field(None, max_length=100)
    sex: Optional[str] = Field(None, max_length=10)
    birthday: Optional[date] = None
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
    
    @field_validator("sex")
    @classmethod
    def sex_must_be_valid(cls, v):
        if v is not None:
            allowed = {"male", "female", "unknown"}
            if v.lower() not in allowed:
                raise ValueError(f"sex must be one of {allowed}")
            return v.lower()
        return v
    
    @field_validator("breed_type")
    @classmethod
    def breed_type_must_be_valid(cls, v):
        if v is not None:
            allowed = {"purebred", "mix"}
            if v.lower() not in allowed:
                raise ValueError(f"breed_type must be one of {allowed}")
            return v.lower()
        return v

class PetRead(BaseModel):
    id: int
    name: str
    species: str
    breed: Optional[str] = None
    breed_type: Optional[str] = None
    breed_secondary: Optional[str] = None
    breed_tertiary: Optional[str] = None
    sex: Optional[str] = None
    birthday: Optional[date] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    medical_notes: Optional[str] = None
    ai_care_tips: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
