from __future__ import annotations

"""ADK Digest Agent — generates daily review digests."""
from google.adk.agents import LlmAgent

from app.models.resource import Resource


async def get_due_resources() -> list[dict]:
    """Get resources that are due for review today.

    Returns:
        A list of resource dictionaries with id, title, summary, url, and review_count.
    """
    from datetime import datetime, timezone
    from sqlalchemy import select
    from app.database import async_session

    async with async_session() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Resource)
            .where(Resource.next_review_at <= now)
            .where(Resource.status != "archived")
            .order_by(Resource.next_review_at)
            .limit(20)
        )
        resources = result.scalars().unique().all()
        return [
            {
                "id": str(r.id),
                "title": r.title or "Untitled",
                "summary": r.summary or "",
                "url": r.url,
                "review_count": r.review_count,
            }
            for r in resources
        ]


async def generate_digest_summary(resources_json: str) -> str:
    """Generate a formatted digest summary for review resources.

    Args:
        resources_json: JSON string of resources to include in the digest.

    Returns:
        A formatted markdown digest summary.
    """
    from app.services.gemini import get_gemini_client, get_settings

    client = get_gemini_client()
    settings = get_settings()

    prompt = f"""Create a brief, engaging daily review digest from these saved resources.
Group them by topic if possible. For each resource, include a one-line reminder of what it's about.
Format as markdown.

Resources: {resources_json}"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )
    return response.text


digest_agent = LlmAgent(
    name="digest_generator",
    model="gemini-2.5-flash",
    instruction="""You generate daily review digests for the user's saved resources.

1. Use get_due_resources to find what's due for review
2. Use generate_digest_summary to create a formatted digest
3. Return the digest to the user

Keep it concise and actionable.""",
    tools=[get_due_resources, generate_digest_summary],
)


async def run_digest_agent(resources: list[Resource]) -> str:
    """Run digest generation directly (without full ADK runner) for the API endpoint."""
    import json

    resources_data = [
        {"title": r.title or "Untitled", "summary": r.summary or "", "url": r.url}
        for r in resources
    ]
    return await generate_digest_summary(json.dumps(resources_data))
