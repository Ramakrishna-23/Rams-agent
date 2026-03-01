from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class TagOut(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class ResourceCreate(BaseModel):
    url: HttpUrl
    title: str | None = None
    notes: str | None = None


class ResourceUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    status: str | None = None


class ResourceOut(BaseModel):
    id: UUID
    url: str
    title: str | None
    summary: str | None
    notes: str | None
    status: str
    tags: list[TagOut]
    review_count: int
    next_review_at: datetime | None
    last_reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResourceDetail(ResourceOut):
    scraped_content: str | None

    model_config = {"from_attributes": True}


class ResourceList(BaseModel):
    items: list[ResourceOut]
    total: int
    page: int
    page_size: int
