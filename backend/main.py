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

         
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)


                               
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup tasks:
    1. Create DB tables
    2. Build / reload FAISS index
    """

    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

                            
    create_tables()

    logger.info("Database tables ready.")

    if settings.RAG_ENABLED and settings.RAG_BUILD_ON_STARTUP:

                                                         
                                                                                     
        from .rag.retriever import get_retriever

        retriever = get_retriever()

        result = retriever.build_index(force_rebuild=False)

        logger.info(f"RAG index: {result}")

    else:

        logger.info(
            "RAG startup indexing skipped "
            f"(RAG_ENABLED={settings.RAG_ENABLED}, "
            f"RAG_BUILD_ON_STARTUP={settings.RAG_BUILD_ON_STARTUP})."
        )

    yield                             


             
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

      
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

        
app.include_router(router, prefix="/api")

                                        
frontend_dist = Path(__file__).parent.parent / "frontend" / "out"

if frontend_dist.exists():

    app.mount(
        "/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend"
    )

    logger.info(f"Serving frontend from {frontend_dist}")


                
if __name__ == "__main__":

    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
