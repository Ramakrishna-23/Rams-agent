from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ReminderCreate(BaseModel):
    resource_id: UUID
    remind_at: datetime


class ReminderOut(BaseModel):
    id: UUID
    resource_id: UUID
    remind_at: datetime
    is_sent: bool
    created_at: datetime

    model_config = {"from_attributes": True}
