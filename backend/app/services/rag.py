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

    # 2b. Enrich with graph-related resources (best-effort)
    try:
        from app.services.graph_service import get_related_resources
        from sqlalchemy import select as sa_select
        from app.models.resource import Resource as ResourceModel

        graph_ids: set[str] = set()
        for rid in resource_ids[:3]:
            related = await get_related_resources(rid, limit=3)
            for rel in related:
                if rel["pg_id"] not in resource_ids and rel["pg_id"] not in graph_ids:
                    graph_ids.add(rel["pg_id"])

        if graph_ids:
            async with async_session() as db2:
                result2 = await db2.execute(
                    sa_select(ResourceModel).where(ResourceModel.id.in_(list(graph_ids)[:3]))
                )
                graph_resources = result2.scalars().all()
                for gr in graph_resources:
                    snippet = (gr.scraped_content or "")[:1500]
                    context_parts.append(
                        f"**[Graph-related] {gr.title or 'Untitled'}** ({gr.url})\n"
                        f"Summary: {gr.summary or 'N/A'}\n"
                        f"Content: {snippet}\n"
                    )
                    resource_ids.append(str(gr.id))
    except Exception:
        pass

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
