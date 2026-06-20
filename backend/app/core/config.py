from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    UPLOAD_DIR: str = "uploads"
    CHROMA_DIR: str = "chroma_db"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_FILE_SIZE_MB: int = 50
    RETRIEVER_K: int = 5

    class Config:
        env_file = ".env"

settings = Settings()
