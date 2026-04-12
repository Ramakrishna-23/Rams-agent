from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.resource import TagOut


class NoteCreate(BaseModel):
    title: str = "Untitled"
    content: str | None = None
    tag_names: list[str] = []


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    tag_names: list[str] | None = None


class NoteOut(BaseModel):
    id: UUID
    title: str
    content: str | None = None
    tags: list[TagOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
