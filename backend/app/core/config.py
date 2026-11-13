from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    app_name: str = "MARS-GUARD"
    database_url: str = "sqlite+aiosqlite:///./marsguard.db"
    redis_url: str = "redis://localhost:6379"
    nasa_api_key: str = "DEMO_KEY"
    secret_key: str = "marsguard-secret-key-change-in-prod"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    environment: str = "development"
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    data_dir: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
    vector_db_path: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/vectordb"))
    ml_models_dir: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/trained_models"))

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()
