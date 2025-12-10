#!/usr/bin/env python3
"""
Create a test user for local testing
"""
from app.database import get_db
from app.models.user import User
from app.schemas.base import UserCreate

def create_test_user():
    """Create a test user in the database"""
    
    # Get database session
    db = next(get_db())
    
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.username == "testuser").first()
        if existing_user:
            print("✅ Test user already exists!")
            print("\n" + "="*50)
            print("TEST LOGIN CREDENTIALS:")
            print("="*50)
            print("Username: testuser")
            print("Password: Test123")
            print("="*50)
            return
        
        # Create test user data
        test_user_data = {
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser",
            "email": "test@example.com",
            "password": "Test123"
        }
        
        # Register the user
        user = User.register(db, test_user_data)
        db.commit()
        
        print("✅ Test user created successfully!")
        print("\n" + "="*50)
        print("TEST LOGIN CREDENTIALS:")
        print("="*50)
        print("Username: testuser")
        print("Password: Test123")
        print("="*50)
        print("\nYou can now login at: http://localhost:8000/login")
        print("Or use the main page: http://localhost:8000")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
