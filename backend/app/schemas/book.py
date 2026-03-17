from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel


class TagOut(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    genre: Optional[str] = None
    status: str = "want_to_read"
    total_chapters: Optional[int] = None
    current_chapter: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    tag_names: List[str] = []


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    genre: Optional[str] = None
    status: Optional[str] = None
    total_chapters: Optional[int] = None
    current_chapter: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    tag_names: Optional[List[str]] = None


class BookOut(BaseModel):
    id: UUID
    title: str
    author: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    genre: Optional[str] = None
    status: str
    total_chapters: Optional[int] = None
    current_chapter: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    tags: List[TagOut] = []
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
