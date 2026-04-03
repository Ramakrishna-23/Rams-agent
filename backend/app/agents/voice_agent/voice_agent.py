from __future__ import annotations

"""Voice Agent — speech-aware conversational assistant powered by Google ADK + Gemini."""

from google.adk.agents import LlmAgent


# ──────────────────────────────────────────────────────────────────
# Tools shared with the voice agent
# ──────────────────────────────────────────────────────────────────

async def search_resources_for_voice(query: str, limit: int = 5) -> list[dict]:
    """Search saved resources using semantic search to answer voice queries.

    Args:
        query: The voice query string.
        limit: Maximum results to return (default 5).

    Returns:
        List of resource dicts with id, title, summary, url.
    """
    from app.database import async_session
    from app.routers.search import _hybrid_search

    async with async_session() as db:
        resources = await _hybrid_search(db, query, limit)
        return [
            {
                "id": str(r.id),
                "title": r.title or "Untitled",
                "summary": (r.summary or "")[:400],
                "url": r.url,
            }
            for r in resources
        ]


async def get_resource_content(resource_id: str) -> dict:
    """Get full content of a specific resource for deeper answers.

    Args:
        resource_id: UUID of the resource.

    Returns:
        Resource dict with title, url, summary, content.
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


async def list_recent_resources(limit: int = 8) -> list[dict]:
    """List the most recently saved resources.

    Args:
        limit: How many to return (default 8).

    Returns:
        List of resource dicts.
    """
    from sqlalchemy import select
    from app.database import async_session
    from app.models.resource import Resource

    async with async_session() as db:
        result = await db.execute(
            select(Resource).order_by(Resource.created_at.desc()).limit(limit)
        )
        resources = result.scalars().unique().all()
        return [
            {
                "id": str(r.id),
                "title": r.title or "Untitled",
                "status": r.status,
                "url": r.url,
            }
            for r in resources
        ]


async def get_inbox_count() -> dict:
    """Return the number of unprocessed items in the inbox.

    Returns:
        Dict with count of inbox items.
    """
    from sqlalchemy import func, select
    from app.database import async_session
    from app.models.resource import Resource

    async with async_session() as db:
        result = await db.execute(
            select(func.count(Resource.id)).where(Resource.status == "inbox")
        )
        count = result.scalar() or 0
        return {"inbox_count": count}


# ──────────────────────────────────────────────────────────────────
# Agent definition
# ──────────────────────────────────────────────────────────────────

voice_agent = LlmAgent(
    name="rams_voice_assistant",
    model="gemini-2.5-flash",
    instruction="""You are Rams — a friendly, concise voice assistant for a personal knowledge management system.

You can:
- Search and retrieve saved resources, notes, and bookmarks
- Answer questions grounded in the user's saved knowledge base
- Report on the user's inbox, reading list, and recent saves
- Summarise articles, resources, or notes on request

Guidelines for voice responses:
- Keep answers SHORT and conversational (1-3 sentences ideally)
- Do NOT use markdown, bullet points, or formatting — plain speech only
- Always cite the resource title when referencing content
- If nothing relevant is found, say so and suggest the user save more on that topic
- Be warm and natural, as if speaking directly to the user""",
    tools=[
        search_resources_for_voice,
        get_resource_content,
        list_recent_resources,
        get_inbox_count,
    ],
)
