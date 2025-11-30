from pydantic import BaseModel, field_validator, Field, model_validator
from typing import Optional, Literal

CalcType = Literal["Add", "Sub", "Multiply", "Divide"]

class CalculationCreate(BaseModel):
    a: float
    b: float
    type: CalcType

    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v):
        allowed = {"Add","Sub","Multiply","Divide"}
        if v not in allowed:
            raise ValueError(f"type must be one of {allowed}")
        return v

    @model_validator(mode="after")
    def no_zero_divisor(self):
        # If the type is Divide, b cannot be zero.
        if self.type == "Divide" and self.b == 0:
            raise ValueError("b cannot be zero for Divide operations")
        return self

class CalculationUpdate(BaseModel):
    a: Optional[float] = None
    b: Optional[float] = None
    type: Optional[CalcType] = None
    result: Optional[float] = None

    @field_validator("type")
    @classmethod
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

    model_config = {"from_attributes": True}
