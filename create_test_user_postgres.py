#!/usr/bin/env python3
"""Create a test user in PostgreSQL database"""
from app.database import SessionLocal
from app.models.user import User
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == "testuser").first()
        if existing_user:
            print("✅ Test user already exists!")
            print(f"Username: testuser")
            print(f"Password: Test123")
            return
        
        # Create new user
        hashed_password = pwd_context.hash("Test123")
        test_user = User(
            id=uuid.uuid4(),
            first_name="Test",
            last_name="User",
            email="test@example.com",
            username="testuser",
            password_hash=hashed_password,
            is_active=True
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print("✅ Test user created successfully!")
        print(f"Username: {test_user.username}")
        print(f"Password: Test123")
        print(f"Email: {test_user.email}")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
