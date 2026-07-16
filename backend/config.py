"""
TechMart AI Customer Support — Configuration
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent.parent


class Settings:
    # App
    APP_NAME: str = "TechMart AI Support"

    APP_VERSION: str = "1.0.0"

    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # LLM Provider
    # Set LLM_PROVIDER to: groq | openai | ollama | anthropic
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")

    # Groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    # Anthropic Claude
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")

    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")

    # Ollama (local)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")

    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1")

    # Embedding
    EMBEDDING_MODEL: str = os.getenv(
        "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
    )

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{BASE_DIR}/customer_support.db"
    )

    # Auth
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "techmart-super-secret-key-change-in-production-2024"
    )

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )  # 24 hours

    # RAG
    KNOWLEDGE_BASE_DIR: Path = BASE_DIR / "knowledge_base"

    VECTOR_STORE_PATH: Path = BASE_DIR / "backend" / "vectorstore" / "faiss_index"

    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "600"))

    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "80"))

    TOP_K_RESULTS: int = int(os.getenv("TOP_K_RESULTS", "4"))

    RAG_ENABLED: bool = os.getenv("RAG_ENABLED", "true").lower() == "true"

    RAG_BUILD_ON_STARTUP: bool = (
        os.getenv("RAG_BUILD_ON_STARTUP", "true").lower() == "true"
    )

    # LLM Generation
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "600"))

    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))

    # Email
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")

    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))

    SMTP_USER: str = os.getenv("SMTP_USER", "")

    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

    SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", "support@techmartelectronics.com")

    # WhatsApp (Twilio)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")

    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")

    TWILIO_WHATSAPP_FROM: str = os.getenv(
        "TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886"
    )

    # Company
    COMPANY_NAME: str = "TechMart Electronics"

    COMPANY_TAGLINE: str = "Your Premium Electronics Partner"

    SUPPORT_PHONE: str = "1-800-TECHMART"

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ]

    def get_llm_config(self) -> dict:
        """Return API key, base URL and model based on chosen provider."""

        if self.LLM_PROVIDER == "groq":

            return {
                "api_key": self.GROQ_API_KEY,
                "base_url": self.GROQ_BASE_URL,
                "model": self.GROQ_MODEL,
            }

        elif self.LLM_PROVIDER == "openai":

            return {
                "api_key": self.OPENAI_API_KEY,
                "base_url": self.OPENAI_BASE_URL,
                "model": self.OPENAI_MODEL,
            }

        elif self.LLM_PROVIDER == "ollama":

            return {
                "api_key": "ollama",
                "base_url": self.OLLAMA_BASE_URL,
                "model": self.OLLAMA_MODEL,
            }

        else:

            # Fallback / mock mode
            return {"api_key": "", "base_url": "", "model": "mock"}


settings = Settings()
