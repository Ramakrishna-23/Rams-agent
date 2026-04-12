from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource import Tag


async def resolve_tags(db: AsyncSession, tag_names: list[str]) -> list[Tag]:
    """Look up or create Tag objects by name. Shared by notes, books, and resources."""
    resolved = []
    for name in tag_names:
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        resolved.append(tag)
    return resolved
