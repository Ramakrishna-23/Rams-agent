from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class SubtaskCreate(BaseModel):
    title: str
    sort_order: int = 0


class SubtaskUpdate(BaseModel):
    title: str | None = None
    is_done: bool | None = None
    sort_order: int | None = None
