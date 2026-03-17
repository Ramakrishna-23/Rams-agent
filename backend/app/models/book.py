from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

book_tags = Table(
    "book_tags",
    Base.metadata,
    Column("book_id", UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Book(Base):
    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    author: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cover_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    isbn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    genre: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="want_to_read", nullable=False)
    total_chapters: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_chapter: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tags: Mapped[List["Tag"]] = relationship(  # type: ignore[name-defined]
        "Tag", secondary=book_tags, lazy="selectin"
    )
