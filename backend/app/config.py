import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Smriti — AI Dementia Care"
    API_PREFIX: str = "/api"
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://localhost:27017/smriti")
    DB_NAME: str = os.getenv("DB_NAME", "smriti")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", os.getenv("REACT_APP_BACKEND_URL", "http://localhost:5173"))
    JWT_SECRET: str = os.getenv("JWT_SECRET", "smriti-ner-secret-key-2026-safe-dementia-care-32chars")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    EMERGENT_LLM_KEY: str = os.getenv("EMERGENT_LLM_KEY", "")
    INTEGRATION_PROXY_URL: str = os.getenv("INTEGRATION_PROXY_URL", "https://integrations.emergentagent.com")
    EMERGENT_STORAGE_PATH: str = os.getenv("EMERGENT_STORAGE_PATH", "./uploads")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
