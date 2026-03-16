from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Index, String, Text, Integer, Table
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
    url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(512))
    scraped_content: Mapped[Optional[str]] = mapped_column(Text)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum(
            "inbox", "unread", "read", "to_review", "archived", "favorite",
            "about_to_do", "lets_do", "doing", "done", "archive",
            name="resource_status",
        ),
        default="inbox",
    )
    embedding = Column(Vector(768))
    search_vector = Column(TSVECTOR)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    next_review_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    priority: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1=urgent, 2=high, 3=medium, 4=low
    recurrence_rule: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # daily/weekly/monthly/weekdays
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )

    tags: Mapped[List["Tag"]] = relationship(secondary=resource_tags, back_populates="resources", lazy="selectin")
    subtasks: Mapped[List["Subtask"]] = relationship(back_populates="resource", lazy="selectin", cascade="all, delete-orphan", order_by="Subtask.sort_order")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="resources", lazy="selectin")
    comments: Mapped[List["ResourceComment"]] = relationship(
        "ResourceComment", back_populates="resource", lazy="selectin",
        cascade="all, delete-orphan", order_by="ResourceComment.created_at"
    )

    __table_args__ = (
        Index("ix_resources_status", "status"),
        Index("ix_resources_next_review", "next_review_at"),
        Index("ix_resources_search_vector", "search_vector", postgresql_using="gin"),
        Index("ix_resources_due_at", "due_at"),
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    resources: Mapped[List["Resource"]] = relationship(secondary=resource_tags, back_populates="tags", lazy="selectin")


class Subtask(Base):
    __tablename__ = "subtasks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    resource: Mapped["Resource"] = relationship(back_populates="subtasks")
