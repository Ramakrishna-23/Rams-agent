from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, HttpUrl

VALID_STATUSES = Literal[
    "inbox", "unread", "read", "to_review", "archived", "favorite",
    "about_to_do", "lets_do", "doing", "done", "archive",
]


class TagOut(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class SubtaskOut(BaseModel):
    id: UUID
    resource_id: UUID
    title: str
    is_done: bool
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ResourceCreate(BaseModel):
    url: HttpUrl | None = None
    title: str | None = None
    notes: str | None = None
    due_at: datetime | None = None
    priority: int | None = None
    recurrence_rule: str | None = None


class ResourceUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    status: VALID_STATUSES | None = None
    tags: list[str] | None = None
    due_at: datetime | None = None
    priority: int | None = None
    recurrence_rule: str | None = None


class ResourceOut(BaseModel):
    id: UUID
    url: str | None
    title: str | None
    summary: str | None
    notes: str | None
    status: str
    tags: list[TagOut]
    subtasks: list[SubtaskOut] = []
    review_count: int
    next_review_at: datetime | None
    last_reviewed_at: datetime | None
    due_at: datetime | None = None
    priority: int | None = None
    recurrence_rule: str | None = None
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
