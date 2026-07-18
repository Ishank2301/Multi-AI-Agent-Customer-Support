"""
TechMart AI Support — Embeddings Manager
Uses sentence-transformers to generate dense vector embeddings.
"""

import logging
from typing import List
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingManager:
    """
    Wraps sentence-transformers for generating embeddings.
    Singleton pattern — one model loaded per process.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):

        self.model_name = model_name

        self._model = None

        logger.info(
            f"EmbeddingManager initialized (model will load on first use): {model_name}"
        )

    def _load_model(self):
        """Lazy-load the sentence-transformer model."""

        if self._model is None:

            logger.info(f"Loading embedding model: {self.model_name}")

            from sentence_transformers import SentenceTransformer

                                                 
            clean_name = self.model_name.replace("sentence-transformers/", "")

            self._model = SentenceTransformer(clean_name)

            logger.info("Embedding model loaded successfully.")

        return self._model

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts.
        Returns a (N, dim) float32 numpy array.
        """

        model = self._load_model()

        embeddings = model.encode(
            texts,
            batch_size=8,
            show_progress_bar=True,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )

        return embeddings.astype(np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        """
        Generate embedding for a single query string.
        Returns a (1, dim) float32 numpy array.
        """

        return self.embed_texts([query])

    @property
    def embedding_dim(self) -> int:

        model = self._load_model()

        return model.get_sentence_embedding_dimension()


                                                    
_embedding_manager: EmbeddingManager | None = None


def get_embedding_manager(model_name: str = "all-MiniLM-L6-v2") -> EmbeddingManager:

    global _embedding_manager

    if _embedding_manager is None:

        _embedding_manager = EmbeddingManager(model_name)

    return _embedding_manager
