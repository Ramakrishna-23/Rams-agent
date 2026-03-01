from __future__ import annotations

"""ADK Chat Agent — RAG-powered conversational search."""
from google.adk.agents import LlmAgent


async def search_resources(query: str, limit: int = 5) -> list[dict]:
    """Search saved resources using hybrid full-text and semantic search.

    Args:
        query: The search query string.
        limit: Maximum number of results to return (default 5).

    Returns:
        A list of resource dictionaries with id, title, summary, and url.
    """
    from app.database import async_session
    from app.routers.search import _hybrid_search

    async with async_session() as db:
        resources = await _hybrid_search(db, query, limit)
        return [
            {
                "id": str(r.id),
                "title": r.title or "Untitled",
                "summary": r.summary or "",
                "url": r.url,
            }
            for r in resources
        ]


async def get_resource_details(resource_id: str) -> dict:
    """Get full details of a specific saved resource.

    Args:
        resource_id: The UUID of the resource to retrieve.

    Returns:
        A dictionary with the resource's title, url, summary, and content snippet.
    """
    from sqlalchemy import select
    from app.database import async_session
    from app.models.resource import Resource

    async with async_session() as db:
        result = await db.execute(select(Resource).where(Resource.id == resource_id))
        r = result.scalar_one_or_none()
        if not r:
            return {"error": "Resource not found"}
        return {
            "id": str(r.id),
            "title": r.title or "Untitled",
            "url": r.url,
            "summary": r.summary or "",
            "content": (r.scraped_content or "")[:3000],
        }


chat_agent = LlmAgent(
    name="knowledge_chat",
    model="gemini-2.5-flash",
    instruction="""You are a helpful assistant that answers questions using the user's saved resources.

When the user asks a question:
1. Use search_resources to find relevant saved resources
2. If needed, use get_resource_details to get more content from specific resources
3. Synthesize an answer based on the found resources
4. Always cite your sources by mentioning the resource title and URL

If no relevant resources are found, say so honestly and suggest the user save more resources on the topic.

Be concise but thorough. Always ground your answers in the saved resources.""",
    tools=[search_resources, get_resource_details],
)
