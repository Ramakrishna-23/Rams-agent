"""Pydantic schemas for the Voice API."""
from __future__ import annotations

from pydantic import BaseModel


class VoiceRequest(BaseModel):
    message: str
    session_id: str | None = None


class VoiceResponse(BaseModel):
    response: str
    session_id: str
