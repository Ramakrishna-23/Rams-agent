from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, String, Text, Integer, Table
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

resource_tags = Table(
    "resource_tags",
    Base.metadata,
    Column("resource_id", UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(512))
    scraped_content: Mapped[Optional[str]] = mapped_column(Text)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("unread", "read", "to_review", "archived", name="resource_status"),
        default="unread",
    )
    embedding = Column(Vector(768))
    search_vector = Column(TSVECTOR)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    next_review_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tags: Mapped[List["Tag"]] = relationship(secondary=resource_tags, back_populates="resources", lazy="selectin")

    __table_args__ = (
        Index("ix_resources_status", "status"),
        Index("ix_resources_next_review", "next_review_at"),
        Index("ix_resources_search_vector", "search_vector", postgresql_using="gin"),
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    resources: Mapped[List["Resource"]] = relationship(secondary=resource_tags, back_populates="tags", lazy="selectin")
