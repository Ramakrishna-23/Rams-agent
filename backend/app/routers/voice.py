from __future__ import annotations

"""Voice API router — text-in / text-out voice interaction endpoint.

The frontend handles WebSpeech API for STT/TTS in the browser.
This endpoint receives the transcribed text and returns the voice agent's
spoken response via SSE streaming so the UI can stream TTS as tokens arrive.
"""

import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from app.schemas.voice import VoiceRequest, VoiceResponse
from app.utils.auth import verify_api_key

router = APIRouter(
    prefix="/api/voice",
    tags=["voice"],
    dependencies=[Depends(verify_api_key)],
)


# ──────────────────────────────────────────────────────────────────
# In-memory session store (keyed by session_id)
# For production you'd store these in Redis or Postgres.
# ──────────────────────────────────────────────────────────────────
_sessions: dict[str, list[dict]] = {}


async def _stream_voice_response(
    message: str,
    session_id: str,
) -> AsyncGenerator[dict, None]:
    """Run the voice agent and yield SSE events."""
    from app.config import get_settings
    import google.genai as genai

    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    # Build history
    history = _sessions.get(session_id, [])

    # Retrieve context from knowledge base
    try:
        from app.agents.voice_agent.voice_agent import search_resources_for_voice
        results = await search_resources_for_voice(message, limit=4)
        context_parts = []
        for r in results:
            context_parts.append(
                f"- {r['title']}: {r['summary']}"
            )
        context_str = (
            "Relevant resources from the knowledge base:\n" + "\n".join(context_parts)
            if context_parts
            else "No directly relevant resources found in the knowledge base."
        )
    except Exception:
        context_str = ""

    system_prompt = (
        "You are Rams — a friendly, concise voice assistant for a personal knowledge "
        "management system.\n\n"
        "Guidelines:\n"
        "- Keep answers SHORT and conversational (1-3 sentences ideally)\n"
        "- Do NOT use markdown, bullet points, or special formatting — plain speech only\n"
        "- Always cite the resource title when referencing content\n"
        "- Be warm and natural, as if talking directly to the user\n\n"
        f"{context_str}"
    )

    # Build messages
    messages = [{"role": "user", "parts": [{"text": system_prompt}]}]
    for turn in history:
        messages.append(turn)
    messages.append({"role": "user", "parts": [{"text": message}]})

    full_response = ""

    try:
        response = client.models.generate_content_stream(
            model=settings.gemini_model,
            contents=messages,
        )
        for chunk in response:
            if chunk.text:
                full_response += chunk.text
                yield {"event": "token", "data": chunk.text}
    except Exception as e:
        yield {"event": "error", "data": str(e)}
        return

    # Update session history
    history.append({"role": "user", "parts": [{"text": message}]})
    history.append({"role": "model", "parts": [{"text": full_response}]})
    # Keep last 10 turns to avoid context overflow
    _sessions[session_id] = history[-20:]

    yield {"event": "done", "data": full_response}


@router.post("/stream")
async def voice_stream(data: VoiceRequest):
    """SSE stream: send transcribed voice text, receive streamed response."""
    session_id = data.session_id or str(uuid.uuid4())
    return EventSourceResponse(
        _stream_voice_response(data.message, session_id),
        headers={"X-Session-Id": session_id},
    )


@router.post("/chat", response_model=VoiceResponse)
async def voice_chat(data: VoiceRequest):
    """Non-streaming: send transcribed voice text, receive complete response."""
    session_id = data.session_id or str(uuid.uuid4())
    full_text = ""
    async for event in _stream_voice_response(data.message, session_id):
        if event["event"] == "done":
            full_text = event["data"]
    return VoiceResponse(response=full_text, session_id=session_id)


@router.delete("/sessions/{session_id}")
async def clear_voice_session(session_id: str):
    """Clear a voice conversation session."""
    _sessions.pop(session_id, None)
    return {"cleared": True}
