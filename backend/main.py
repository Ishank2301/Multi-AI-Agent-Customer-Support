"""
TechMart AI Customer Support — FastAPI Application Entry Point

Run with:
    cd backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Or from project root:
    uvicorn backend.main:app --reload
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .api.routes import router
from .config import settings
from .database.db import create_tables

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


# Lifespan (startup / shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup tasks:
    1. Create DB tables
    2. Build / reload FAISS index
    """

    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Create database tables
    create_tables()

    logger.info("Database tables ready.")

    # Build or reload the FAISS knowledge base index
    from .rag.retriever import get_retriever

    retriever = get_retriever()

    result = retriever.build_index(force_rebuild=False)

    logger.info(f"RAG index: {result}")

    # Pre-load embedding model AND warm it up with a test query
    from .rag.embeddings import get_embedding_manager

    embedder = get_embedding_manager(settings.EMBEDDING_MODEL)

    # Warm up with a dummy encode to fully initialize the model
    try:

        embedder.embed_query("warm up query")

        logger.info("Embedding model pre-loaded and warmed up successfully.")

    except Exception as e:

        logger.warning(f"Embedding warm-up failed: {e}")

    yield  # --- server is running ---


# FastAPI App
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Multi-Agent AI Customer Support System for TechMart Electronics. "
        "Powered by Retrieval-Augmented Generation (RAG) and specialized AI agents."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(router, prefix="/api")

# Serve Frontend Static Files (optional)
frontend_dist = Path(__file__).parent.parent / "frontend" / "out"

if frontend_dist.exists():

    app.mount(
        "/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend"
    )

    logger.info(f"Serving frontend from {frontend_dist}")


# Dev entrypoint
if __name__ == "__main__":

    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
