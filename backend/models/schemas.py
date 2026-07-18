"""
TechMart AI Support — Pydantic Schemas (request/response models)
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

      


class RegisterRequest(BaseModel):

    name: str = Field(..., min_length=2, max_length=80)

    email: EmailStr

    password: str = Field(..., min_length=6)

    phone: Optional[str] = Field(
        None, description="Phone with country code e.g. +919876543210"
    )


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


class TokenResponse(BaseModel):

    access_token: str

    token_type: str = "bearer"

    user: "UserOut"


class UserOut(BaseModel):

    id: str

    name: str

    email: str

    phone: Optional[str] = None

    is_admin: bool

    created_at: datetime

    class Config:

        from_attributes = True


      


class ChatRequest(BaseModel):

    message: str = Field(..., min_length=1, max_length=2000)

    session_id: Optional[str] = None                             


class AgentInfo(BaseModel):

    name: str

    intent: str

    confidence: float

    sentiment: str


class ChatResponse(BaseModel):

    session_id: str

    message_id: str

    response: str

    agent: str

    intent: str

    sentiment: str

    sentiment_score: float

    response_time_ms: float

    context_retrieved: bool

    timestamp: datetime


                   


class MessageOut(BaseModel):

    id: str

    role: str

    content: str

    agent: str

    intent: str

    sentiment: str

    timestamp: datetime

    class Config:

        from_attributes = True


class SessionOut(BaseModel):

    id: str

    title: str

    summary: Optional[str]

    created_at: datetime

    updated_at: datetime

    message_count: int = 0

    class Config:

        from_attributes = True


class SessionDetailOut(BaseModel):

    id: str

    title: str

    summary: Optional[str]

    created_at: datetime

    messages: List[MessageOut]

    class Config:

        from_attributes = True


class SummaryResponse(BaseModel):

    session_id: str

    summary: str


          


class FeedbackRequest(BaseModel):

    session_id: str

    message_id: Optional[str] = None

    rating: int = Field(..., ge=1, le=5)

    comment: Optional[str] = Field(None, max_length=500)


class FeedbackOut(BaseModel):

    id: str

    rating: int

    comment: Optional[str]

    created_at: datetime

    class Config:

        from_attributes = True


           


class AgentStat(BaseModel):

    agent: str

    count: int

    percentage: float


class IntentStat(BaseModel):

    intent: str

    count: int


class SentimentStat(BaseModel):

    sentiment: str

    count: int


class AnalyticsResponse(BaseModel):

    total_conversations: int

    total_messages: int

    average_rating: float

    avg_response_time_ms: float

    agent_distribution: List[AgentStat]

    intent_distribution: List[IntentStat]

    sentiment_distribution: List[SentimentStat]

    daily_conversations: List[dict]


                        


class KBDocOut(BaseModel):

    id: str

    filename: str

    chunk_count: int

    file_size_bytes: int

    indexed_at: datetime

    class Config:

        from_attributes = True


class KBRebuildResponse(BaseModel):

    message: str

    documents_indexed: int

    total_chunks: int


         


class SuccessResponse(BaseModel):

    message: str

    detail: Optional[str] = None
