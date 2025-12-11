from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)  # Medication name
    dosage = Column(String(100), nullable=False)  # e.g., "10mg", "1 tablet"
    frequency = Column(String(100), nullable=False)  # e.g., "twice daily", "every 8 hours"
    route = Column(String(50), nullable=True)  # oral, topical, injection, etc.
    reason = Column(Text, nullable=True)  # Why the medication is prescribed
    prescribing_vet = Column(String(200), nullable=True)
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)  # Optional end date
    is_active = Column(Boolean, default=True)  # Active/inactive status
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Reference to pets table
    pet = relationship("Pet", back_populates="medications")
