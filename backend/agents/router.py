"""TechMart AI Support — Agent Router & Orchestrator

Responsibilities:
    1. Detect intent from user message (via LLM or keyword fallback)
    2. Detect sentiment (positive / neutral / negative / frustrated)
    3. Route to one or more specialized agents
    4. Aggregate responses from multiple agents when needed"""

import json
import logging
import re
from typing import Dict, List, Optional, Tuple
from ..config import settings
from .agents import BillingAgent, ComplaintAgent, FAQAgent, ProductAgent, TechnicalAgent
from .base import BaseAgent
from .llm_client import get_llm_client

logger = logging.getLogger(__name__)

# Intent & Sentiment Definitions
INTENTS = {
    "billing": [
        "payment",
        "invoice",
        "subscription",
        "charge",
        "bill",
        "refund",
        "pricing",
        "price",
        "cost",
        "fee",
        "money",
        "credit",
        "debit",
        "affirm",
        "financing",
        "plan",
        "renew",
        "cancel subscription",
        "techmart care",
        "rewards points",
        "care plan",
        "care pricing",
        "how much does",
        "what does it cost",
        "care basic",
        "care pro",
        "monthly plan",
        "annual plan",
        "per month",
        "per year",
        "subscription cost",
        "subscription price",
        "plan price",
        "upgrade plan",
        "care subscription",
    ],
    "refund": [
        "refund",
        "return",
        "money back",
        "reimburse",
        "cancel order",
        "exchange",
        "sent back",
        "ship back",
        "return policy",
        "refund policy",
        "वापसी",
        "रिटर्न",
        "रिटर्न पॉलिसी",
        "वापसी नीति",
        "पैसे वापस",
        "política de devoluciones",
        "devoluciones",
        "politique de retour",
        "remboursement",
        "rückgabe",
        "rückerstattung",
    ],
    "technical": [
        "not working",
        "broken",
        "error",
        "bug",
        "crash",
        "install",
        "setup",
        "login",
        "password",
        "reset",
        "update",
        "freeze",
        "slow",
        "wifi",
        "bluetooth",
        "connect",
        "driver",
        "screen",
        "battery drain",
        "overheating",
        "won't turn on",
        "black screen",
    ],
    "product": [
        "product",
        "laptop",
        "phone",
        "tablet",
        "watch",
        "earbuds",
        "speaker",
        "ultrabook",
        "smartphone",
        "tabpro",
        "smartwatch",
        "spec",
        "specification",
        "feature",
        "compare",
        "difference",
        "which is better",
        "available",
        "stock",
        "color",
        "size",
        "recommend",
        "buy",
        "purchase",
        "x14",
        "x14 pro",
        "ultrabook",
        "air 13",
        "pro 15",
        "homehub",
        "earbuds pro",
        "series 3",
        "techmart care",
        "stylus",
        "keyboard",
        "charger",
        "accessory",
        "how much",
        "what does",
        "tell me about",
        "best product",
        "which model",
        "latest",
        "new model",
        "upgrade",
    ],
    "complaint": [
        "complaint",
        "terrible",
        "awful",
        "worst",
        "horrible",
        "angry",
        "furious",
        "disgusted",
        "unacceptable",
        "disappointed",
        "scam",
        "never again",
        "lawsuit",
        "garbage",
        "waste of money",
        "demand",
        "escalate",
        "manager",
        "supervisor",
    ],
    "faq": [
        "hours",
        "contact",
        "where",
        "when",
        "how long",
        "shipping",
        "deliver",
        "track",
        "account",
        "warranty",
        "how do I",
        "can I",
        "do you",
        "business hours",
        "store location",
        "contact number",
    ],
}

SENTIMENT_KEYWORDS = {
    "positive": [
        "thank",
        "thanks",
        "thankyou",
        "thank you",
        "great",
        "awesome",
        "excellent",
        "perfect",
        "wonderful",
        "amazing",
        "fantastic",
        "good",
        "helpful",
        "love",
        "happy",
        "satisfied",
        "pleased",
        "brilliant",
        "superb",
        "outstanding",
        "resolved",
        "fixed",
        "works",
        "working now",
        "appreciate",
        "appreciated",
    ],
    "negative": [
        "bad",
        "poor",
        "terrible",
        "horrible",
        "worst",
        "awful",
        "disappointed",
        "unhappy",
        "not satisfied",
        "not working",
        "broken",
        "failed",
        "error",
        "wrong",
        "issue",
        "problem",
        "doesn't work",
        "not good",
        "very bad",
        "really bad",
        "not happy",
        "not helpful",
        "useless",
        "waste",
        "unable",
        "can't",
        "cannot",
        "stuck",
        "confused",
    ],
    "frustrated": [
        "angry",
        "furious",
        "frustrated",
        "fed up",
        "ridiculous",
        "unacceptable",
        "disgusted",
        "outraged",
        "livid",
        "pathetic",
        "worst ever",
        "never again",
        "demand refund",
        "very angry",
        "so angry",
        "extremely frustrated",
        "hate this",
        "this is ridiculous",
        "still not working",
        "been waiting",
        "no response",
        "ignored",
        "wasting my time",
        "waste of money",
        "regret buying",
    ],
}


class AgentRouter:
    """Orchestrates intent detection, sentiment analysis, and agent dispatch."""

    def __init__(self):

        self._agents: Dict[str, BaseAgent] = {
            "billing": BillingAgent(),
            "refund": BillingAgent(),  # refunds handled by billing agent
            "technical": TechnicalAgent(),
            "product": ProductAgent(),
            "complaint": ComplaintAgent(),
            "faq": FAQAgent(),
            "general": FAQAgent(),
        }

        self._llm = get_llm_client()

    # Public API
    async def route(
        self, user_message: str, conversation_history: Optional[List[dict]] = None
    ) -> dict:
        """Main entry point. Returns full routing + agent response payload."""

        history = conversation_history or []

        # 1. Detect intent and sentiment
        routing = await self._detect_intent_and_sentiment(user_message, history)

        intent: str = routing["intent"]

        sentiment: str = routing["sentiment"]

        sentiment_score: float = routing["sentiment_score"]

        confidence: float = routing["confidence"]

        suggested_agents: List[str] = routing["suggested_agents"]

        # 2. Determine primary agent
        primary_intent = suggested_agents[0] if suggested_agents else "general"

        # Safety check — ensure primary_intent is a valid agent
        valid_agents = {
            "billing",
            "refund",
            "technical",
            "product",
            "complaint",
            "faq",
            "general",
        }

        if primary_intent not in valid_agents:

            primary_intent = "general"

        # 3. If frustrated, always also involve complaint agent for tone
        if sentiment == "frustrated" and "complaint" not in suggested_agents:

            suggested_agents.append("complaint")

        logger.info(
            f"Routing | intent = {intent} | sentiment = {sentiment}"
            f"| confidence={confidence:.2f} | agents = {suggested_agents}"
        )

        # 4. Invoke primary agent
        primary_agent = self._agents.get(primary_intent, self._agents["faq"])

        primary_result = await primary_agent.respond(user_message, history)

        # 5. If multiple agents, invoke secondary and merge (rare case)
        response_text = primary_result["response"]

        if len(suggested_agents) > 1 and "complaint" in suggested_agents[1:]:

            complaint_agent = self._agents["complaint"]

            complaint_result = await complaint_agent.respond(user_message, history)

            # Prepend an empathy statement from the complaint agent if frustrated
            empathy = self._extract_empathy_line(complaint_result["response"])

            if empathy and empathy not in response_text:

                response_text = empathy + "\n\n" + response_text

        return {
            "response": response_text,
            "agent": primary_agent.domain,
            "agent_name": primary_agent.name,
            "intent": intent,
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "confidence": confidence,
            "suggested_agents": suggested_agents,
            "context_retrieved": primary_result.get("context_retrieved", False),
            "sources": primary_result.get("sources", []),
        }

    async def detect_intent(self, message: str) -> dict:
        """Lightweight public method for just getting the intent/sentiment."""

        return await self._detect_intent_and_sentiment(message, [])

    # Intent & Sentiment Detection
    async def _detect_intent_and_sentiment(
        self, message: str, history: List[dict]
    ) -> dict:

        # Stage 1 — keyword baseline (always fast)
        keyword_result = self._keyword_detect(message)

        # Skip LLM detection if keyword confidence is already high
        # This saves 1-2 seconds per request
        if keyword_result.get("confidence", 0) >= 0.7:

            logger.info(
                "High confidence keyword detection — skipping LLM classification"
            )

            return keyword_result

        # Stage 2 — LLM refinement only for ambiguous messages
        try:

            llm_result = await self._llm_detect(message, history)

            if llm_result and llm_result.get("confidence", 0) > 0.5:

                return llm_result

        except Exception as e:

            logger.warning(f"LLM intent detection failed, using keywords: {e}")

        return keyword_result

    def _keyword_detect(self, message: str) -> dict:
        """Fast keyword-based intent and sentiment detection."""

        msg_lower = message.lower()

        # Sentiment detection — check frustrated first (most specific)
        msg_lower = message.lower()
        sentiment = "neutral"
        sentiment_score = 0.0

        frustrated_count = sum(
            1 for kw in SENTIMENT_KEYWORDS["frustrated"] if kw in msg_lower
        )
        negative_count = sum(
            1 for kw in SENTIMENT_KEYWORDS["negative"] if kw in msg_lower
        )
        positive_count = sum(
            1 for kw in SENTIMENT_KEYWORDS["positive"] if kw in msg_lower
        )

        if frustrated_count > 0:
            sentiment = "frustrated"
            sentiment_score = -1.0
        elif negative_count > 0:
            sentiment = "negative"
            sentiment_score = -0.5
        elif positive_count > 0:
            sentiment = "positive"
            sentiment_score = 0.8
        else:
            sentiment = "neutral"
            sentiment_score = 0.0

        for label, keywords in SENTIMENT_KEYWORDS.items():

            if any(kw in msg_lower for kw in keywords):

                sentiment = label

                if label == "frustrated":

                    sentiment_score = -1.0

                elif label == "negative":

                    sentiment_score = -0.5

                elif label == "positive":

                    sentiment_score = 0.8

                break

        # Intent detection (score each category)
        scores: Dict[str, int] = {intent: 0 for intent in INTENTS}

        for intent, keywords in INTENTS.items():

            for kw in keywords:

                if kw in msg_lower:

                    scores[intent] += 1

        best_intent = max(scores, key=lambda k: scores[k])

        best_score = scores[best_intent]

        if best_score == 0:

            best_intent = "general"

            confidence = 0.4

        else:

            confidence = min(0.5 + best_score * 0.1, 0.9)

        # Build suggested agents list
        # Sort by score desc and take top 2 that scored > 0
        ranked = sorted(
            [(k, v) for k, v in scores.items() if v > 0],
            key=lambda x: x[1],
            reverse=True,
        )

        suggested = [r[0] for r in ranked[:2]] or ["general"]

        return {
            "intent": best_intent,
            "confidence": confidence,
            "sentiment": sentiment,
            "sentiment_score": sentiment_score,
            "suggested_agents": suggested,
            "method": "keyword",
        }

    async def _llm_detect(self, message: str, history: List[dict]) -> Optional[dict]:
        """LLM-based intent and sentiment classification using structured output."""

        # Summarize recent history for context

        history_summary = ""

        if history:

            recent = history[-4:]

            history_summary = "\n".join(
                f"{m['role'].upper()}: {m['content'][:120]}" for m in recent
            )

        # Detect language of the message
        from langdetect import detect

        detected_lang = "English"

        msg_lower = message.lower()

        if any(
            c in msg_lower for c in ["क", "ख", "ग", "घ", "आ", "इ", "ई", "उ", "ए", "ओ"]
        ):

            detected_lang = "Hindi"

        elif any(
            word in msg_lower
            for word in ["hola", "como", "gracias", "problema", "ayuda"]
        ):

            detected_lang = "Spanish"

        elif any(
            word in msg_lower
            for word in ["bonjour", "merci", "problème", "aide", "comment"]
        ):

            detected_lang = "French"

        elif any(
            word in msg_lower
            for word in ["danke", "bitte", "hilfe", "problem", "hallo"]
        ):

            detected_lang = "German"

        prompt = f"""You are an intent classification system for a customer support chatbot.

                Customer message language detected: {detected_lang}

                Classify the customer message below into EXACTLY ONE intent from this list:
                - billing → payment, invoice, subscription, pricing, TechMart Care plans
                - refund → return requests, refunds, order cancellations
                - technical → device issues, setup, errors, troubleshooting, password reset
                - product → product info, specs, comparisons, availability, recommendations
                - complaint → complaints, dissatisfaction, escalations
                - faq → general questions, policies, shipping, hours, account help
                - general → doesn't fit any category above

                Also classify the sentiment:
                - positive / neutral / negative / frustrated

                Recent conversation:
                {history_summary or "(no prior context)"}

                Customer message: "{message}"

                Respond ONLY with valid JSON (no markdown, no backticks):
                {{
                    
                    "intent": "<one of the intent labels>",

                    "confidence": <0.0-1.0>,

                    "sentiment": "<positive|neutral|negative|frustrated>",

                    "sentiment_score": <-1.0 to 1.0>,

                    "suggested_agents": ["<primary agent>", "<optional secondary>"],

                    "detected_language": "{detected_lang}",

                    "reasoning": "<one sentence>"

                }}"""

        raw = await self._llm.complete(prompt, max_tokens=150)

        raw = raw.strip()

        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)

        raw = re.sub(r"\s*```$", "", raw)

        try:

            parsed = json.loads(raw)

        except json.JSONDecodeError:

            logger.warning(f"LLM returned invalid JSON: {raw[:100]}")

            raise ValueError("Invalid JSON from LLM")

        # Validate
        valid_intents = {
            "billing",
            "refund",
            "technical",
            "product",
            "complaint",
            "faq",
            "general",
        }

        valid_sentiments = {"positive", "neutral", "negative", "frustrated"}

        intent = parsed.get("intent", "general")

        if intent not in valid_intents:

            intent = "general"

        sentiment = parsed.get("sentiment", "neutral")

        if sentiment not in valid_sentiments:

            sentiment = "neutral"

        # Normalize agent names returned by LLM to valid domain names
        AGENT_NAME_MAP = {
            "knowledge base": "faq",
            "live chat": "faq",
            "returns": "billing",
            "return policy": "billing",
            "support": "faq",
            "general support": "faq",
            "customer service": "faq",
            "customer relations": "complaint",
            "tech support": "technical",
            "product specialist": "product",
            "technical support": "technical",
            "billing support": "billing",
            "complaint handling": "complaint",
        }

        raw_agents = parsed.get("suggested_agents", [intent])

        normalized_agents = [
            AGENT_NAME_MAP.get(a.lower(), a.lower()) for a in raw_agents
        ]

        # Filter to only valid agent domains
        valid_agents = {
            "billing",
            "refund",
            "technical",
            "product",
            "complaint",
            "faq",
            "general",
        }

        normalized_agents = [a for a in normalized_agents if a in valid_agents] or [
            intent
        ]

        return {
            "intent": intent,
            "confidence": float(parsed.get("confidence", 0.7)),
            "sentiment": sentiment,
            "sentiment_score": float(parsed.get("sentiment_score", 0.0)),
            "suggested_agents": normalized_agents,
            "method": "llm",
        }

    # Helpers
    @staticmethod
    def _extract_empathy_line(complaint_response: str) -> str:
        """Extract the first sentence of the complaint agent's response as an empathy opener."""

        lines = complaint_response.strip().split(".")

        if lines:

            return lines[0].strip() + "."

        return ""


# Singleton
_router: Optional[AgentRouter] = None


def get_router() -> AgentRouter:

    global _router

    if _router is None:

        _router = AgentRouter()

    return _router
