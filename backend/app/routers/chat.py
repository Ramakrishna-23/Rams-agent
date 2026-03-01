from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models.chat import ChatMessage, ChatSession
from app.schemas.chat import ChatRequest, ChatSessionDetail, ChatSessionOut
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/chat", tags=["chat"], dependencies=[Depends(verify_api_key)])


@router.post("")
async def chat(data: ChatRequest, db: AsyncSession = Depends(get_db)):
    """RAG chat endpoint with SSE streaming."""
    # Get or create session
    if data.session_id:
        result = await db.execute(select(ChatSession).where(ChatSession.id == data.session_id))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        session = ChatSession(title=data.message[:100])
        db.add(session)
        await db.flush()

    # Save user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=data.message)
    db.add(user_msg)
    await db.flush()
    await db.commit()

    async def event_generator():
        from app.services.rag import rag_chat

        full_response = ""
        resource_ids = []
        async for chunk in rag_chat(data.message, str(session.id)):
            if chunk.get("type") == "text":
                full_response += chunk["content"]
                yield {"event": "message", "data": chunk["content"]}
            elif chunk.get("type") == "sources":
                resource_ids = chunk["resource_ids"]
                yield {"event": "sources", "data": str(resource_ids)}

        # Save assistant message
        async with (await _get_fresh_session()) as fresh_db:
            assistant_msg = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=full_response,
                resource_ids=resource_ids,
            )
            fresh_db.add(assistant_msg)
            await fresh_db.commit()

        yield {"event": "done", "data": str(session.id)}

    return EventSourceResponse(event_generator())


async def _get_fresh_session():
    from app.database import async_session
    return async_session()


@router.get("/sessions", response_model=list[ChatSessionOut])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).order_by(ChatSession.created_at.desc()))
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session
