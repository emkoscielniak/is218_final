from sqlalchemy import Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base

class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    a = Column(Float, nullable=False)
    b = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # preferable to use Enum but keep string for DB portability
    result = Column(Float, nullable=True)

    # Reference to a users table
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    user = relationship("User", back_populates="calculations")

    def compute(self):
        """Compute result on demand using the factory pattern."""
        from app.operations.calculation_factory import CalculationFactory
        
        try:
            return CalculationFactory.execute_calculation(self.type, self.a, self.b)
        except ValueError as e:
            raise ValueError(f"Unsupported calculation type: {self.type}") from e
