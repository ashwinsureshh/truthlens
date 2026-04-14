import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/truthlens"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
    MODEL_PATH = os.environ.get("MODEL_PATH", "../model/checkpoints/roberta-truthlens")
