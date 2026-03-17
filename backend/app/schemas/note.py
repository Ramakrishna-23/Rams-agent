from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel


class TagOut(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    title: str = "Untitled"
    content: Optional[str] = None
    tag_names: List[str] = []


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tag_names: Optional[List[str]] = None


class NoteOut(BaseModel):
    id: UUID
    title: str
    content: Optional[str] = None
    tags: List[TagOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
