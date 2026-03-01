from __future__ import annotations

"""RAG pipeline — retrieve, augment, generate with streaming."""
import json
from typing import AsyncIterator

from app.services.gemini import get_gemini_client
from app.config import get_settings


async def rag_chat(query: str, session_id: str) -> AsyncIterator[dict]:
    """RAG chat: search resources, build context, stream Gemini response."""
    from app.database import async_session
    from app.routers.search import _hybrid_search

    # 1. Retrieve relevant resources
    async with async_session() as db:
        resources = await _hybrid_search(db, query, 5)

    resource_ids = [str(r.id) for r in resources]

    # 2. Build context from resources
    context_parts = []
    for r in resources:
        snippet = (r.scraped_content or "")[:2000]
        context_parts.append(
            f"**{r.title or 'Untitled'}** ({r.url})\n"
            f"Summary: {r.summary or 'N/A'}\n"
            f"Content: {snippet}\n"
        )

    context = "\n---\n".join(context_parts) if context_parts else "No relevant resources found."

    # 3. Generate response with Gemini (streaming)
    client = get_gemini_client()
    settings = get_settings()

    prompt = f"""Answer the user's question based on their saved resources below.
Cite sources by title and URL. If no resources are relevant, say so.

## Saved Resources
{context}

## User Question
{query}"""

    response = client.models.generate_content_stream(
        model=settings.gemini_model,
        contents=prompt,
    )

    # Yield sources first
    yield {"type": "sources", "resource_ids": resource_ids}

    # Stream text chunks
    for chunk in response:
        if chunk.text:
            yield {"type": "text", "content": chunk.text}
