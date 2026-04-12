from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.resource import TagOut


class BookCreate(BaseModel):
    title: str
    author: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    genre: str | None = None
    status: str = "want_to_read"
    total_chapters: int | None = None
    current_chapter: int | None = None
    rating: int | None = None
    notes: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    tag_names: list[str] = []


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    genre: str | None = None
    status: str | None = None
    total_chapters: int | None = None
    current_chapter: int | None = None
    rating: int | None = None
    notes: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    tag_names: list[str] | None = None


class BookLookupOut(BaseModel):
    title: str | None = None
    author: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    description: str | None = None


class BookOut(BaseModel):
    id: UUID
    title: str
    author: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    genre: str | None = None
    status: str
    total_chapters: int | None = None
    current_chapter: int | None = None
    rating: int | None = None
    notes: str | None = None
    tags: list[TagOut] = []
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
