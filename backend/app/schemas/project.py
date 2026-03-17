from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    color: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None


class CommentOut(BaseModel):
    id: UUID
    resource_id: UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str


class SubtaskInProjectOut(BaseModel):
    id: UUID
    title: str
    is_done: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ResourceInProjectOut(BaseModel):
    id: UUID
    title: str | None
    status: str
    priority: int | None
    due_at: datetime | None
    project_id: UUID | None
    created_at: datetime
    subtasks: list[SubtaskInProjectOut] = []

    model_config = {"from_attributes": True}


class TimeSessionCreate(BaseModel):
    duration_seconds: int
    started_at: datetime
    ended_at: datetime


class TimeSessionOut(BaseModel):
    id: UUID
    project_id: UUID
    duration_seconds: int
    started_at: datetime
    ended_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class TimeSessionsResponse(BaseModel):
    sessions: list[TimeSessionOut]
    total_seconds: int


class ProjectOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    color: str | None
    resource_count: int
    done_count: int
    total_seconds: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectWithResourcesOut(ProjectOut):
    resources: list[ResourceInProjectOut] = []
