from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any

from sqlalchemy import DateTime, ForeignKey, String, Text, Integer, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MentalModel(Base):
    """A mental model entry — the content library of the latticework."""
    __tablename__ = "mm_models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[str] = mapped_column(Text, nullable=False, default="")
    author: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    era: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    source_book: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    theory: Mapped[str] = mapped_column(Text, nullable=False, default="")
    metaphor: Mapped[str] = mapped_column(Text, nullable=False, default="")
    key_question: Mapped[str] = mapped_column(Text, nullable=False, default="")
    field: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    domain: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    real_examples: Mapped[List[Any]] = mapped_column(JSONB, nullable=False, default=list)
    self_check_questions: Mapped[List[str]] = mapped_column(JSONB, nullable=False, default=list)
    related_models: Mapped[List[Any]] = mapped_column(JSONB, nullable=False, default=list)
    scenarios: Mapped[List[Any]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class PracticeSession(Base):
    """Records each time the user completes a daily practice loop."""
    __tablename__ = "mm_practice_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_slug: Mapped[str] = mapped_column(String(100), nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(50), nullable=False)  # curated | wildcard
    user_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationship to decision log entry (optional)
    decision_log: Mapped[Optional["DecisionLog"]] = relationship(
        "DecisionLog", back_populates="practice_session", uselist=False
    )


class DecisionLog(Base):
    """Persistent log of decisions analysed through mental models."""
    __tablename__ = "mm_decision_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    practice_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mm_practice_sessions.id", ondelete="SET NULL"), nullable=True
    )
    model_slugs: Mapped[List[str]] = mapped_column(JSON, default=list)  # array of model slugs
    entry_type: Mapped[str] = mapped_column(String(20), default="curated")  # curated | wildcard
    domain: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # career|business|finance|relationships|health|other
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verdict: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # yes|no|wait|null
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    revisit_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    practice_session: Mapped[Optional["PracticeSession"]] = relationship(
        "PracticeSession", back_populates="decision_log"
    )
