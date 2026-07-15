"""
TechMart AI Support — FAISS Retriever
Builds and queries a FAISS index over knowledge-base chunks.
"""

import logging
import os
import pickle
from pathlib import Path
from typing import List, Optional, Tuple
import numpy as np
from ..config import settings
from .document_processor import TextChunk, load_knowledge_base
from .embeddings import EmbeddingManager, get_embedding_manager

logger = logging.getLogger(__name__)


class RetrievalResult:

    def __init__(self, text: str, source: str, score: float, chunk_id: int):

        self.text = text

        self.source = source

        self.score = score  # cosine similarity (higher = more relevant)

        self.chunk_id = chunk_id

    def __repr__(self):

        return f"RetrievalResult(source={self.source}, score={self.score:.3f})"


class FAISSRetriever:
    """
    Builds a FAISS flat-L2 index and enables semantic search over knowledge chunks.
    Index and chunk data are persisted to disk and reloaded on startup.
    """

    def __init__(self):

        self.index = None

        self.chunks: List[TextChunk] = []

        self.embedder: Optional[EmbeddingManager] = None

        self._ready = False

        self._embedding_error_reported = False

        self._index_path = settings.VECTOR_STORE_PATH / "faiss.index"

        self._chunks_path = settings.VECTOR_STORE_PATH / "chunks.pkl"

    # Public API

    def build_index(self, force_rebuild: bool = False) -> dict:
        """
        Load knowledge base and build (or reload) the FAISS index.
        Returns stats dict.
        """

        import faiss

        self.embedder = get_embedding_manager(settings.EMBEDDING_MODEL)

        # Try to reload from disk unless force_rebuild
        if (
            not force_rebuild
            and self._index_path.exists()
            and self._chunks_path.exists()
        ):

            try:

                self._load_from_disk()

                logger.info(
                    f"Reloaded FAISS index from disk ({len(self.chunks)} chunks)."
                )

                self._ready = True

                return {"status": "reloaded", "chunks": len(self.chunks)}

            except Exception as e:

                logger.warning(f"Failed to reload index from disk: {e}. Rebuilding.")

        # Build fresh
        logger.info("Building FAISS index from knowledge base...")

        chunks, file_stats = load_knowledge_base(
            settings.KNOWLEDGE_BASE_DIR,
            settings.CHUNK_SIZE,
            settings.CHUNK_OVERLAP,
        )

        if not chunks:

            logger.error("No chunks to index. Knowledge base may be empty.")

            return {"status": "error", "chunks": 0}

        self.chunks = chunks

        texts = [c.text for c in chunks]

        logger.info(f"Generating embeddings for {len(texts)} chunks...")

        try:

            embeddings = self.embedder.embed_texts(texts)

        except Exception as exc:

            logger.error(
                "Unable to load the embedding model; RAG indexing is disabled: %s", exc
            )

            return {"status": "embedding_unavailable", "chunks": 0}

        dim = embeddings.shape[1]

        self.index = faiss.IndexFlatL2(dim)  # Inner Product (cosine after L2 norm)

        self.index.add(embeddings)

        # Persist to disk
        self._save_to_disk()

        self._ready = True

        total_docs = len(set(c.source for c in chunks))

        logger.info(
            f"FAISS index built: {len(chunks)} chunks across {total_docs} documents."
        )

        return {
            "status": "built",
            "chunks": len(chunks),
            "documents": total_docs,
            "file_stats": file_stats,
        }

    def retrieve(
        self,
        query: str,
        top_k: int = None,
        source_filter: Optional[str] = None,
    ) -> List[RetrievalResult]:
        """
        Semantic search: return the top-k most relevant chunks for a query.
        Optionally filter to a specific source document.
        """

        if not self._ready or self.index is None:

            logger.warning("Retriever not ready. Call build_index() first.")

            return []

        k = top_k or settings.TOP_K_RESULTS

        try:

            query_emb = self.embedder.embed_query(query)  # (1, dim)

        except Exception as exc:

            if not self._embedding_error_reported:

                logger.error(
                    "RAG retrieval is unavailable because the embedding model could not load: %s",
                    exc,
                )

                self._embedding_error_reported = True

            return []

        # Search (using more candidates if filtering, then trim)

        search_k = k * 5 if source_filter else k

        scores, indices = self.index.search(query_emb, min(search_k, len(self.chunks)))

        results: List[RetrievalResult] = []

        for score, idx in zip(scores[0], indices[0]):

            if idx < 0 or idx >= len(self.chunks):

                continue

            chunk = self.chunks[idx]

            # Handle both dict and TextChunk objects
            if isinstance(chunk, dict):

                chunk_text = chunk.get("text", "")

                chunk_source = chunk.get("source", "unknown")

                chunk_id = chunk.get("chunk_id", idx)

            else:

                chunk_text = chunk.text

                chunk_source = chunk.source

                chunk_id = chunk.chunk_id

            if source_filter and chunk_source != source_filter:

                continue

            results.append(
                RetrievalResult(
                    text=chunk_text,
                    source=chunk_source,
                    score=float(score),
                    chunk_id=chunk_id,
                )
            )

            if len(results) >= k:

                break

        return results

    def format_context(self, results: List[RetrievalResult]) -> str:
        """Format retrieval results into a context string for the LLM prompt."""

        if not results:

            return ""

        parts = []

        for i, r in enumerate(results, 1):

            source_label = r.source.replace("_", " ").title()

            parts.append(f"[Source: {source_label}]\n{r.text}")

        return "\n\n---\n\n".join(parts)

    @property
    def is_ready(self) -> bool:

        return self._ready

    @property
    def chunk_count(self) -> int:

        return len(self.chunks)

    # Private Helpers

    def _save_to_disk(self):

        import faiss

        self._index_path.parent.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self.index, str(self._index_path))

        with open(self._chunks_path, "wb") as f:

            pickle.dump(self.chunks, f)

        logger.info(f"FAISS index saved to {self._index_path}")

    def _load_from_disk(self):

        import faiss

        self.index = faiss.read_index(str(self._index_path))

        with open(self._chunks_path, "rb") as f:

            self.chunks = pickle.load(f)

        self.embedder = get_embedding_manager(settings.EMBEDDING_MODEL)


# Module-level singleton
_retriever: Optional[FAISSRetriever] = None


def get_retriever() -> FAISSRetriever:

    global _retriever

    if _retriever is None:

        _retriever = FAISSRetriever()

    return _retriever
