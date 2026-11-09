from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ruta absoluta al .env (backend/.env), funciona sin importar desde dónde se ejecute
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8")


settings = Settings()