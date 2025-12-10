from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/fastapi_db"
    OPENAI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()