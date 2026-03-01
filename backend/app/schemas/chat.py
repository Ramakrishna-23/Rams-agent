from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: UUID | None = None


class ChatMessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    resource_ids: list[UUID] | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionOut(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionDetail(ChatSessionOut):
    messages: list[ChatMessageOut]

    model_config = {"from_attributes": True}
