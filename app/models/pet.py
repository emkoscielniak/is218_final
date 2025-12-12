from sqlalchemy import Column, Integer, Float, String, ForeignKey, Text, DateTime, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.database import Base

class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    species = Column(String(50), nullable=False)  # dog, cat, bird, etc.
    breed = Column(String(100), nullable=True)  # Primary breed
    breed_type = Column(String(20), nullable=True)  # 'purebred' or 'mix'
    breed_secondary = Column(String(100), nullable=True)  # Second breed for mixes
    breed_tertiary = Column(String(100), nullable=True)  # Third breed for mixes
    sex = Column(String(10), nullable=True)  # male, female, unknown
    birthday = Column(Date, nullable=True)  # Date of birth
    age = Column(Integer, nullable=True)  # age in years
    weight = Column(Float, nullable=True)  # weight in pounds
    medical_notes = Column(Text, nullable=True)
    ai_care_tips = Column(Text, nullable=True)  # AI-generated care recommendations
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Reference to a users table
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="pets")
    
    # Activities relationship
    activities = relationship("Activity", back_populates="pet", cascade="all, delete-orphan")
    
    # Medications relationship
    medications = relationship("Medication", back_populates="pet", cascade="all, delete-orphan")
    
    # Reminders relationship
    reminders = relationship("Reminder", back_populates="pet", cascade="all, delete-orphan")
