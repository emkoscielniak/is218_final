"""
Create test pet for demonstration
"""
from app.database import get_db
from app.models.pet import Pet
from sqlalchemy.orm import Session

def create_test_pet():
    """Create a test pet in the database for the test user."""
    db = next(get_db())
    
    try:
        # Get the test user ID
        from app.models.user import User
        test_user = db.query(User).filter(User.username == 'testuser').first()
        
        if not test_user:
            print("❌ Test user not found. Please run create_test_user.py first.")
            return
        
        # Create a test pet
        test_pet = Pet(
            name="Max",
            species="dog",
            breed="Golden Retriever",
            age=3,
            weight=65.5,
            medical_notes="Annual checkup scheduled for next month. Allergic to chicken.",
            ai_care_tips="1. Daily exercise: 30-60 minutes of walking or playing\n2. Regular grooming: Brush coat 2-3 times per week\n3. Diet: High-quality dog food, avoid chicken products",
            user_id=test_user.id
        )
        
        db.add(test_pet)
        db.commit()
        db.refresh(test_pet)
        
        print("✅ Test pet created successfully!")
        print("=" * 50)
        print(f"Pet Name: {test_pet.name}")
        print(f"Species: {test_pet.species}")
        print(f"Breed: {test_pet.breed}")
        print(f"Age: {test_pet.age} years")
        print(f"Weight: {test_pet.weight} lbs")
        print("=" * 50)
        print("\nYou can now login and see this pet in your PetWell dashboard!")
        
    except Exception as e:
        print(f"❌ Error creating test pet: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_pet()
