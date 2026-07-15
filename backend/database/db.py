"""
TechMart AI Support — Database Models (SQLAlchemy + SQLite)
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker
from ..config import settings

if settings.DATABASE_URL.startswith("sqlite"):

    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )

else:

    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


class User(Base):

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    email = Column(String, unique=True, index=True, nullable=False)

    name = Column(String, nullable=False)

    password_hash = Column(String, nullable=False)

    phone = Column(String, nullable=True)

    is_admin = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship(
        "ChatSession", back_populates="user", cascade="all, delete-orphan"
    )

    feedback = relationship("Feedback", back_populates="user")


class ChatSession(Base):

    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    title = Column(String, default="New Conversation")

    summary = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow)

    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="sessions")

    messages = relationship(
        "Message",
        back_populates="session",
        order_by="Message.timestamp",
        cascade="all, delete-orphan",
    )

    feedback = relationship("Feedback", back_populates="session")


class Message(Base):

    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)

    role = Column(String, nullable=False)

    content = Column(Text, nullable=False)

    agent = Column(String, default="general")

    intent = Column(String, default="general")

    sentiment = Column(
        String, default="neutral"
    )  # positive|neutral|negative|frustrated

    sentiment_score = Column(Float, default=0.0)

    response_time_ms = Column(Float, default=0.0)

    context_used = Column(Boolean, default=False)

    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class Feedback(Base):

    __tablename__ = "feedback"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)

    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    message_id = Column(String, ForeignKey("messages.id"), nullable=True)

    rating = Column(Integer, nullable=False)  # 1–5

    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="feedback")

    user = relationship("User", back_populates="feedback")


class KnowledgeBaseDoc(Base):
    """Tracks which documents are loaded into the vector store."""

    __tablename__ = "kb_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    filename = Column(String, nullable=False, unique=True)

    chunk_count = Column(Integer, default=0)

    indexed_at = Column(DateTime, default=datetime.utcnow)

    file_size_bytes = Column(Integer, default=0)


class SupportTicket(Base):

    __tablename__ = "support_tickets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False)

    ticket_number = Column(String, unique=True)

    subject = Column(String, nullable=False)

    status = Column(String, default="open")

    priority = Column(String, default="medium")

    agent = Column(String, default="general")

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow)


def create_tables() -> None:

    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and ensures it's closed."""

    db: Session = SessionLocal()

    try:

        yield db

    finally:

        db.close()
