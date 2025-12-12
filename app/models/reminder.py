from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    reminder_type = Column(String, nullable=False)  # medication, appointment, vaccination, grooming, other
    reminder_date = Column(DateTime, nullable=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="reminders")
    pet = relationship("Pet", back_populates="reminders")
