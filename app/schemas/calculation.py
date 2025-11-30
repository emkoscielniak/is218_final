from pydantic import BaseModel, validator, Field
from typing import Optional, Literal

CalcType = Literal["Add", "Sub", "Multiply", "Divide"]

class CalculationCreate(BaseModel):
    a: float
    b: float
    type: CalcType

    @validator("type")
    def type_must_be_valid(cls, v):
        allowed = {"Add","Sub","Multiply","Divide"}
        if v not in allowed:
            raise ValueError(f"type must be one of {allowed}")
        return v

    @validator("b")
    def no_zero_divisor(cls, v, values):
        # If the type is Divide, b cannot be zero.
        t = values.get("type")
        # Note: Pydantic validates fields in order of definition; 'type' may not be available yet
        if t == "Divide" and v == 0:
            raise ValueError("b cannot be zero for Divide operations")
        return v

class CalculationUpdate(BaseModel):
    a: Optional[float] = None
    b: Optional[float] = None
    type: Optional[CalcType] = None
    result: Optional[float] = None

    @validator("type")
    def type_must_be_valid(cls, v):
        if v is not None:
            allowed = {"Add", "Sub", "Multiply", "Divide"}
            if v not in allowed:
                raise ValueError(f"type must be one of {allowed}")
        return v

class CalculationRead(BaseModel):
    id: int
    a: float
    b: float
    type: CalcType
    result: Optional[float] = None

    class Config:
        orm_mode = True
