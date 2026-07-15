"""TechMart AI Support — Base AgentAll specialized agents inherit from this class."""

import logging
from typing import List, Optional
from ..config import settings
from ..rag.retriever import FAISSRetriever, RetrievalResult, get_retriever
from .llm_client import LLMClient, get_llm_client

logger = logging.getLogger(__name__)

COMPANY = settings.COMPANY_NAME


class BaseAgent:
    """Base class for all TechMart specialized agents.
    Each subclass defines:
        - name: display name
        - domain: short identifier used in logs/DB
        - system_prompt: the LLM persona for this agent
        - relevant_sources: which KB documents to prioritise"""

    name: str = "General Support"

    domain: str = "general"

    relevant_sources: List[str] = []  # empty = search all sources

    # Core System Prompt Template
    SYSTEM_TEMPLATE = """You are {name}, a specialized AI customer support agent for {company}.
                        Your role: {role_description}
                        
                        GUIDELINES:
                            - Be empathetic, professional, and solution-oriented.
                            - Always base your answers on the provided CONTEXT from our knowledge base.
                            - If the CONTEXT does not contain enough information, say so clearly and offer to escalate.
                            - Do not invent policies, prices, or product details not mentioned in the CONTEXT.
                            - Keep responses concise (3–5 sentences unless the topic requires more detail).
                            - When referencing specific policies or prices, mention the source (e.g., "per our Refund Policy").
                            - If you cannot resolve the issue, offer: email support@techmartelectronics.com or call 1-800-TECHMART.
                            - End with a friendly close and ask if there's anything else you can help with.
                            
                        Company: {company}
                        Support Phone: 1-800-TECHMART (1-800-832-4627)
                        Support Email: support@techmartelectronics.com
                        Business Hours: Mon–Fri 8 AM–9 PM EST; Sat–Sun 9 AM–6 PM EST"""

    def __init__(self):

        self._retriever: FAISSRetriever = get_retriever()

        self._llm: LLMClient = get_llm_client()

    # Abstract-ish properties (override in subclass)
    @property
    def role_description(self) -> str:

        return "Handle general customer inquiries and provide helpful support."

    def build_system_prompt(self, extra: str = "") -> str:

        base = (
            f"You are {self.name}, a specialized AI customer support agent for {COMPANY}.\n\n"
            f"Your role: {self.role_description}\n\n"
            "========================================\n"
            "CRITICAL LANGUAGE RULE — MUST FOLLOW:\n"
            "========================================\n"
            "1. Detect the language of the LAST customer message.\n"
            "2. You MUST respond in the EXACT SAME language.\n"
            "3. If the customer writes in Hindi → respond ONLY in Hindi.\n"
            "4. If the customer writes in Spanish → respond ONLY in Spanish.\n"
            "5. If the customer writes in English → respond ONLY in English.\n"
            "6. NEVER mix languages in a single response.\n"
            "7. This rule overrides everything else.\n\n"
            "GUIDELINES:\n"
            "- Be empathetic, professional, and solution-oriented.\n"
            "- Always base your answers on the provided CONTEXT from our knowledge base.\n"
            "- If the CONTEXT does not contain enough information, say so clearly and offer to escalate.\n"
            "- Do not invent policies, prices, or product details not mentioned in the CONTEXT.\n"
            "- Keep responses concise (3-5 sentences unless the topic requires more detail).\n"
            "- When referencing specific policies or prices, mention the source.\n"
            "- If you cannot resolve the issue, offer: email support@techmartelectronics.com or call 1-800-TECHMART.\n"
            "- End with a friendly close and ask if there is anything else you can help with.\n\n"
            f"Company: {COMPANY}\n"
            "Support Phone: 1-800-TECHMART (1-800-832-4627)\n"
            "Support Email: support@techmartelectronics.com\n"
            "Business Hours: Mon-Fri 8 AM-9 PM EST; Sat-Sun 9 AM-6 PM EST\n"
        )

        if extra:

            base += f"\n\n{extra}"

        return base

    # Main Entry Point
    async def respond(
        self,
        user_message: str,
        conversation_history: Optional[List[dict]] = None,
        top_k: int = None,
    ) -> dict:
        """Generate a response to the user message. Returns: dict with keys: response, context_retrieved, sources"""

        history = conversation_history or []

        # 1. Retrieve relevant context from knowledge base
        context, sources, retrieved = await self._retrieve_context(
            user_message, top_k or settings.TOP_K_RESULTS
        )

        # 2. Build the messages list (history + current message)
        messages = self._build_messages(user_message, history, context)

        # 3. Detect language and build system prompt
        try:
            system = self.build_system_prompt() or ""
        except Exception:
            system = ""
        if not system:
            system = (
                f"You are {self.name}, a helpful customer support agent for TechMart Electronics. "
                f"Your role: {self.role_description}. Be professional, empathetic, and helpful. "
                f"Base answers on the knowledge base context provided."
            )

        # Detect language from CURRENT message only (not history)
        lang_hint = self._detect_language(user_message)

        system += (
            f"\n\n⚠️ CRITICAL LANGUAGE INSTRUCTION:\n"
            f"The customer's CURRENT message language is: {lang_hint}\n"
            f"You MUST respond in {lang_hint} ONLY.\n"
            f"Ignore the language of previous messages in the conversation.\n"
            f"Base your language choice ONLY on the current message above."
        )

        if context:

            system += f"\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n{context}"

        # 4. Call LLM
        response_text = await self._llm.chat(
            messages=messages,
            system=system,
        )

        return {
            "response": response_text,
            "context_retrieved": retrieved,
            "sources": sources,
            "agent": self.domain,
        }

    # Helpers
    def _detect_language(self, text: str) -> str:
        """Simple language detection based on character/word patterns."""

        # Hindi — Devanagari unicode block
        if any("\u0900" <= c <= "\u097f" for c in text):

            return "Hindi"

        text_lower = text.lower()

        # Spanish
        if any(
            word in text_lower
            for word in [
                "hola",
                "como",
                "gracias",
                "problema",
                "ayuda",
                "quiero",
                "necesito",
                "tengo",
                "precio",
                "reembolso",
                "factura",
            ]
        ):

            return "Spanish"

        # French
        if any(
            word in text_lower
            for word in [
                "bonjour",
                "merci",
                "problème",
                "aide",
                "comment",
                "voulez",
                "remboursement",
                "facture",
                "prix",
                "produit",
            ]
        ):

            return "French"

        # German
        if any(
            word in text_lower
            for word in [
                "danke",
                "bitte",
                "hilfe",
                "problem",
                "hallo",
                "ich",
                "rückerstattung",
                "rechnung",
                "preis",
                "produkt",
            ]
        ):

            return "German"

        # Japanese
        if any("\u3040" <= c <= "\u30ff" for c in text):

            return "Japanese"

        # Arabic
        if any("\u0600" <= c <= "\u06ff" for c in text):

            return "Arabic"

        # Chinese
        if any("\u4e00" <= c <= "\u9fff" for c in text):

            return "Chinese"

        return "English"

    async def _retrieve_context(
        self, query: str, top_k: int
    ) -> tuple[str, List[str], bool]:
        """Retrieve relevant chunks and format them as context."""

        if not self._retriever.is_ready:

            return "", [], False

        results: List[RetrievalResult] = self._retriever.retrieve(
            query, top_k=top_k, source_filter=None
        )  # each agent can override this

        if not results:

            return "", [], False

        context = self._retriever.format_context(results)

        sources = list({r.source for r in results})

        return context, sources, True

    def _build_messages(
        self, user_message: str, history: List[dict], context: str
    ) -> List[dict]:

        messages = []

        MAX_HISTORY_TURNS = 3

        for turn in history[-MAX_HISTORY_TURNS:]:

            messages.append({"role": turn["role"], "content": turn["content"]})

        # Add current message with explicit language reminder
        lang = self._detect_language(user_message)

        messages.append(
            {
                "role": "user",
                "content": f"{user_message}\n\n[SYSTEM NOTE: Respond in {lang} only]",
            }
        )

        return messages

    def __repr__(self):

        return f"<Agent:{self.domain}>"
