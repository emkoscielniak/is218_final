# main.py

from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, field_validator  # Use @validator for Pydantic 1.x
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.pet import Pet
from app.models.activity import Activity
from app.schemas.base import UserCreate, UserRead
from app.schemas.user import UserResponse, Token, UserLogin
from app.schemas.pet import PetCreate, PetRead, PetUpdate
from app.schemas.activity import ActivityCreate, ActivityRead, ActivityUpdate
from app.auth.dependencies import get_current_user, get_current_active_user
from typing import List
import uvicorn
import logging
from openai import OpenAI
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PetWell", description="AI-powered pet care management platform")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Setup html directory
templates = Jinja2Templates(directory="html")

# Initialize OpenAI client
openai_client = None
if settings.OPENAI_API_KEY:
    try:
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info(f"✅ OpenAI client initialized successfully with model: {settings.AI_MODEL}")
    except Exception as e:
        logger.error(f"❌ OpenAI client initialization failed: {e}")
else:
    logger.warning("⚠️ OPENAI_API_KEY not found in environment. AI features will be disabled.")

# Custom Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTPException on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Extracting error messages
    error_messages = "; ".join([f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()])
    logger.error(f"ValidationError on {request.url.path}: {error_messages}")
    return JSONResponse(
        status_code=400,
        content={"error": error_messages},
    )

@app.get("/")
async def read_root():
    """
    Redirect to login page.
    """
    return RedirectResponse(url="/login", status_code=302)

@app.get("/dashboard")
async def dashboard(request: Request):
    """
    Serve the dashboard/index page for logged-in users.
    """
    return templates.TemplateResponse("index_new.html", {"request": request})

@app.get("/register")
async def register_page(request: Request):
    """
    Serve the registration page.
    """
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/login")
async def login_page(request: Request):
    """
    Serve the login page.
    """
    return templates.TemplateResponse("login.html", {"request": request})

# User Authentication and Registration Routes
@app.post("/users/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user using UserCreate schema.
    """
    try:
        # Truncate password to avoid bcrypt 72-byte limit
        user_dict = user_data.model_dump()
        if 'password' in user_dict:
            password_bytes = user_dict['password'].encode('utf-8')[:72]
            user_dict['password'] = password_bytes.decode('utf-8', errors='ignore')
        
        user = User.register(db, user_dict)
        db.commit()
        db.refresh(user)
        return UserRead.model_validate(user)
    except ValueError as e:
        logger.error(f"User registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected registration error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/users/login", response_model=Token)
async def login_user(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token verifying hashed passwords.
    """
    try:
        token_data = User.authenticate(db, user_credentials.username, user_credentials.password)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Legacy endpoints for backward compatibility
@app.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user_legacy(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user (legacy endpoint).
    """
    return await register_user(user_data, db)

@app.post("/login", response_model=Token)
async def login_user_legacy(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token (legacy endpoint).
    """
    try:
        token_data = User.authenticate(db, form_data.username, form_data.password)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/login/json", response_model=Token)
async def login_user_json(
    user_credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with JSON payload and return access token.
    """
    try:
        token_data = User.authenticate(db, user_credentials.username, user_credentials.password)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"JSON Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get current user information.
    """
    return current_user

# Pet BREAD endpoints
@app.get("/pets", response_model=List[PetRead])
async def browse_pets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Browse all pets belonging to the logged-in user with pagination.
    """
    try:
        pets = db.query(Pet).filter(
            Pet.user_id == current_user.id
        ).offset(skip).limit(limit).all()
        return [PetRead.model_validate(pet) for pet in pets]
    except Exception as e:
        logger.error(f"Browse pets error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/pets/{id}", response_model=PetRead)
async def read_pet(
    id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Read a specific pet by ID (user-specific).
    """
    try:
        pet = db.query(Pet).filter(
            Pet.id == id,
            Pet.user_id == current_user.id
        ).first()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        return PetRead.model_validate(pet)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Read pet error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/pets", response_model=PetRead, status_code=status.HTTP_201_CREATED)
async def add_pet(
    pet_data: PetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add a new pet for the logged-in user using PetCreate schema.
    """
    try:
        # Create the pet instance
        pet = Pet(
            name=pet_data.name,
            species=pet_data.species,
            breed=pet_data.breed,
            age=pet_data.age,
            weight=pet_data.weight,
            medical_notes=pet_data.medical_notes,
            user_id=current_user.id
        )
        
        # Generate AI care tips if OpenAI is available
        if openai_client:
            try:
                prompt = f"Provide 3 brief care tips for a {pet_data.species}"
                if pet_data.breed:
                    prompt += f" (breed: {pet_data.breed})"
                if pet_data.age:
                    prompt += f" that is {pet_data.age} years old"
                prompt += ". Keep it concise and practical."
                
                response = openai_client.chat.completions.create(
                    model=settings.AI_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200
                )
                pet.ai_care_tips = response.choices[0].message.content
            except Exception as ai_error:
                logger.warning(f"AI care tips generation failed: {ai_error}")
                pet.ai_care_tips = "AI care tips unavailable"
        
        # Save to database
        db.add(pet)
        db.commit()
        db.refresh(pet)
        
        return PetRead.model_validate(pet)
    except ValueError as e:
        logger.error(f"Add pet error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected add pet error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/pets/{id}", response_model=PetRead)
async def edit_pet(
    id: int,
    pet_update: PetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Edit/update an existing pet (user-specific).
    """
    try:
        pet = db.query(Pet).filter(
            Pet.id == id,
            Pet.user_id == current_user.id
        ).first()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Update fields that are provided
        update_data = pet_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(pet, field, value)
        
        db.commit()
        db.refresh(pet)
        
        return PetRead.model_validate(pet)
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Edit pet error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected edit pet error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.patch("/pets/{id}", response_model=PetRead)
async def patch_pet(
    id: int,
    pet_update: PetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Partially update an existing pet (user-specific).
    """
    try:
        pet = db.query(Pet).filter(
            Pet.id == id,
            Pet.user_id == current_user.id
        ).first()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Update fields that are provided
        update_data = pet_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(pet, field, value)
        
        db.commit()
        db.refresh(pet)
        
        return PetRead.model_validate(pet)
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Patch pet error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected patch pet error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/pets/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a pet by ID (user-specific).
    """
    try:
        pet = db.query(Pet).filter(
            Pet.id == id,
            Pet.user_id == current_user.id
        ).first()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        db.delete(pet)
        db.commit()
        
        return None  # 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete pet error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/pets/{id}/regenerate-tips", response_model=PetRead)
async def regenerate_care_tips(
    id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Regenerate AI care tips for a specific pet.
    """
    try:
        pet = db.query(Pet).filter(
            Pet.id == id,
            Pet.user_id == current_user.id
        ).first()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        if not openai_client:
            raise HTTPException(status_code=503, detail="AI service unavailable")
        
        # Generate new AI care tips
        prompt = f"Provide 3 detailed care tips for a {pet.species}"
        if pet.breed:
            prompt += f" (breed: {pet.breed})"
        if pet.age:
            prompt += f" that is {pet.age} years old"
        if pet.medical_notes:
            prompt += f". Medical notes: {pet.medical_notes[:100]}"
        prompt += ". Keep it practical and actionable."
        
        response = openai_client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        pet.ai_care_tips = response.choices[0].message.content
        
        db.commit()
        db.refresh(pet)
        
        return PetRead.model_validate(pet)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regenerate tips error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

# ===========================
# Activity Endpoints
# ===========================

@app.post("/activities", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity: ActivityCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new activity for a pet.
    """
    try:
        # Verify pet belongs to user
        pet = db.query(Pet).filter(Pet.id == activity.pet_id, Pet.user_id == current_user.id).first()
        if not pet:
            raise HTTPException(status_code=404, detail="Pet not found")
        
        # Create activity
        new_activity = Activity(**activity.model_dump())
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        
        logger.info(f"Activity created: {new_activity.id} for pet {pet.name}")
        return ActivityRead.model_validate(new_activity)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create activity error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/activities", response_model=List[ActivityRead])
async def get_activities(
    pet_id: int = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all activities for the current user's pets.
    Optionally filter by pet_id.
    """
    try:
        # Get user's pet IDs
        user_pet_ids = [pet.id for pet in current_user.pets]
        
        query = db.query(Activity).filter(Activity.pet_id.in_(user_pet_ids))
        
        if pet_id:
            # Verify pet belongs to user
            if pet_id not in user_pet_ids:
                raise HTTPException(status_code=404, detail="Pet not found")
            query = query.filter(Activity.pet_id == pet_id)
        
        activities = query.order_by(Activity.activity_date.desc()).offset(skip).limit(limit).all()
        return [ActivityRead.model_validate(activity) for activity in activities]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get activities error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/activities/{id}", response_model=ActivityRead)
async def get_activity(
    id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific activity by ID.
    """
    try:
        # Get user's pet IDs
        user_pet_ids = [pet.id for pet in current_user.pets]
        
        activity = db.query(Activity).filter(
            Activity.id == id,
            Activity.pet_id.in_(user_pet_ids)
        ).first()
        
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        return ActivityRead.model_validate(activity)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get activity error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/activities/{id}", response_model=ActivityRead)
async def update_activity(
    id: int,
    activity_update: ActivityUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update an activity.
    """
    try:
        # Get user's pet IDs
        user_pet_ids = [pet.id for pet in current_user.pets]
        
        activity = db.query(Activity).filter(
            Activity.id == id,
            Activity.pet_id.in_(user_pet_ids)
        ).first()
        
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        # Update fields
        update_data = activity_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(activity, key, value)
        
        db.commit()
        db.refresh(activity)
        
        logger.info(f"Activity updated: {activity.id}")
        return ActivityRead.model_validate(activity)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update activity error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/activities/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete an activity.
    """
    try:
        # Get user's pet IDs
        user_pet_ids = [pet.id for pet in current_user.pets]
        
        activity = db.query(Activity).filter(
            Activity.id == id,
            Activity.pet_id.in_(user_pet_ids)
        ).first()
        
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        db.delete(activity)
        db.commit()
        
        logger.info(f"Activity deleted: {id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete activity error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and Docker health checks.
    """
    return {"status": "healthy", "timestamp": "2025-11-30"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
