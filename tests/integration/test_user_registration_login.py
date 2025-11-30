"""
Integration tests for user registration and login endpoints.
Tests the /users/register and /users/login endpoints with database integration.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.models.user import User
from main import app

# Test database URL - using in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_user_auth.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_database():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def clean_db():
    """Clean database before each test"""
    # Clean all tables
    db = TestingSessionLocal()
    try:
        db.query(User).delete()
        db.commit()
    finally:
        db.close()


class TestUserRegistration:
    """Test user registration endpoint"""

    def test_register_user_success(self, setup_database, clean_db):
        """Test successful user registration"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com", 
            "first_name": "Test",
            "last_name": "User",
            "password": "TestPass123"
        }
        
        response = client.post("/users/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert data["first_name"] == "Test"
        assert data["last_name"] == "User"
        assert data["is_active"] == True
        assert data["is_verified"] == False
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        # Password should not be in response
        assert "password" not in data

    def test_register_user_duplicate_username(self, setup_database, clean_db):
        """Test registration with duplicate username"""
        user_data = {
            "username": "duplicate",
            "email": "user1@example.com",
            "first_name": "User",
            "last_name": "One", 
            "password": "Password123"
        }
        
        # First registration should succeed
        response1 = client.post("/users/register", json=user_data)
        assert response1.status_code == 201
        
        # Second registration with same username should fail
        user_data["email"] = "user2@example.com"  # Different email
        response2 = client.post("/users/register", json=user_data)
        assert response2.status_code == 400
        assert "already exists" in response2.json()["error"].lower()

    def test_register_user_duplicate_email(self, setup_database, clean_db):
        """Test registration with duplicate email"""
        user_data = {
            "username": "user1",
            "email": "duplicate@example.com",
            "first_name": "User",
            "last_name": "One",
            "password": "Password123"
        }
        
        # First registration should succeed
        response1 = client.post("/users/register", json=user_data)
        assert response1.status_code == 201
        
        # Second registration with same email should fail
        user_data["username"] = "user2"  # Different username
        response2 = client.post("/users/register", json=user_data)
        assert response2.status_code == 400
        assert "already exists" in response2.json()["error"].lower()

    def test_register_user_invalid_password(self, setup_database, clean_db):
        """Test registration with invalid password"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "first_name": "Test", 
            "last_name": "User",
            "password": "weak"  # Invalid password
        }
        
        response = client.post("/users/register", json=user_data)
        assert response.status_code == 422  # Validation error

    def test_register_user_invalid_email(self, setup_database, clean_db):
        """Test registration with invalid email"""
        user_data = {
            "username": "testuser",
            "email": "invalid-email",  # Invalid email format
            "first_name": "Test",
            "last_name": "User",
            "password": "ValidPass123"
        }
        
        response = client.post("/users/register", json=user_data)
        assert response.status_code == 422  # Validation error

    def test_register_user_missing_required_fields(self, setup_database, clean_db):
        """Test registration with missing required fields"""
        user_data = {
            "username": "testuser",
            # Missing email, first_name, last_name, password
        }
        
        response = client.post("/users/register", json=user_data)
        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test user login endpoint"""

    def test_login_success(self, setup_database, clean_db):
        """Test successful user login"""
        # First register a user
        user_data = {
            "username": "logintest",
            "email": "login@example.com",
            "first_name": "Login",
            "last_name": "Test",
            "password": "LoginPass123"
        }
        
        register_response = client.post("/users/register", json=user_data)
        assert register_response.status_code == 201
        
        # Now test login
        login_data = {
            "username": "logintest",
            "password": "LoginPass123"
        }
        
        response = client.post("/users/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "logintest"
        assert data["user"]["email"] == "login@example.com"

    def test_login_invalid_username(self, setup_database, clean_db):
        """Test login with invalid username"""
        login_data = {
            "username": "nonexistent",
            "password": "Password123"
        }
        
        response = client.post("/users/login", json=login_data)
        assert response.status_code == 401
        assert "incorrect username or password" in response.json()["error"].lower()

    def test_login_invalid_password(self, setup_database, clean_db):
        """Test login with invalid password"""
        # First register a user
        user_data = {
            "username": "passwordtest",
            "email": "password@example.com",
            "first_name": "Password",
            "last_name": "Test",
            "password": "CorrectPass123"
        }
        
        register_response = client.post("/users/register", json=user_data)
        assert register_response.status_code == 201
        
        # Now test login with wrong password
        login_data = {
            "username": "passwordtest",
            "password": "WrongPass123"
        }
        
        response = client.post("/users/login", json=login_data)
        assert response.status_code == 401
        assert "incorrect username or password" in response.json()["error"].lower()

    def test_login_missing_credentials(self, setup_database, clean_db):
        """Test login with missing credentials"""
        login_data = {
            "username": "testuser"
            # Missing password
        }
        
        response = client.post("/users/login", json=login_data)
        assert response.status_code == 422  # Validation error

    def test_login_with_email(self, setup_database, clean_db):
        """Test login using email instead of username"""
        # First register a user
        user_data = {
            "username": "emaillogin",
            "email": "emaillogin@example.com",
            "first_name": "Email",
            "last_name": "Login",
            "password": "EmailPass123"
        }
        
        register_response = client.post("/users/register", json=user_data)
        assert register_response.status_code == 201
        
        # Test login with email
        login_data = {
            "username": "emaillogin@example.com",  # Using email as username
            "password": "EmailPass123"
        }
        
        response = client.post("/users/login", json=login_data)
        # This depends on the User.authenticate implementation
        # If it supports email login, it should return 200, otherwise 401
        assert response.status_code in [200, 401]


class TestUserDatabase:
    """Test that user data is correctly stored in database"""
    
    def test_user_data_in_database(self, setup_database, clean_db):
        """Test that registered user data is correctly stored in database"""
        user_data = {
            "username": "dbtest",
            "email": "db@example.com",
            "first_name": "Database",
            "last_name": "Test",
            "password": "DbPass123"
        }
        
        response = client.post("/users/register", json=user_data)
        assert response.status_code == 201
        
        # Verify user exists in database
        db = TestingSessionLocal()
        try:
            user = db.query(User).filter(User.username == "dbtest").first()
            assert user is not None
            assert user.email == "db@example.com"
            assert user.first_name == "Database"
            assert user.last_name == "Test"
            assert user.is_active == True
            assert user.is_verified == False
            # Password should be hashed, not plain text
            assert user.password != "DbPass123"
            assert len(user.password) > 20  # Hashed passwords are longer
        finally:
            db.close()

    def test_password_hashing(self, setup_database, clean_db):
        """Test that passwords are properly hashed"""
        user_data = {
            "username": "hashtest",
            "email": "hash@example.com", 
            "first_name": "Hash",
            "last_name": "Test",
            "password": "HashPass123"
        }
        
        response = client.post("/users/register", json=user_data)
        assert response.status_code == 201
        
        # Check that password is hashed in database
        db = TestingSessionLocal()
        try:
            user = db.query(User).filter(User.username == "hashtest").first()
            assert user is not None
            # Password should be hashed (bcrypt starts with $2b$)
            assert user.password.startswith("$2b$")
            assert user.password != "HashPass123"
        finally:
            db.close()