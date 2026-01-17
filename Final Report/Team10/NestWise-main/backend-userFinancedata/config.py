import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_URL: str = os.getenv("MONGO_URL", "mongodb://nestwise-mongo:27017")
    MONGO_DB_USERFIN: str = os.getenv("MONGO_DB_USERFIN", "user_finance_ingest")
    # UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/data/uploads")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://userfin-redis:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://userfin-redis:6379/2")

    class Config:
        env_file = ".env"


settings = Settings()
