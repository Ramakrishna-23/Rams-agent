from __future__ import annotations

"""Pydantic schemas for the Voice API."""

from pydantic import BaseModel


class VoiceRequest(BaseModel):
    message: str
    session_id: str | None = None


class VoiceResponse(BaseModel):
    response: str
    session_id: str
