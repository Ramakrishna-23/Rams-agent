from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceOut
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/digest", tags=["digest"], dependencies=[Depends(verify_api_key)])


@router.get("", response_model=list[ResourceOut])
async def get_digest(db: AsyncSession = Depends(get_db)):
    """Get resources due for review today."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Resource)
        .where(Resource.next_review_at <= now)
        .where(Resource.status != "archived")
        .order_by(Resource.next_review_at)
    )
    return result.scalars().unique().all()


@router.post("/generate")
async def generate_digest(db: AsyncSession = Depends(get_db)):
    """Generate daily digest summary using Digest Agent. Triggered by Cloud Scheduler."""
    from app.agents.digest_agent import run_digest_agent

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Resource)
        .where(Resource.next_review_at <= now)
        .where(Resource.status != "archived")
        .order_by(Resource.next_review_at)
    )
    resources = result.scalars().unique().all()

    if not resources:
        return {"summary": "No resources due for review today.", "count": 0}

    summary = await run_digest_agent(resources)
    return {"summary": summary, "count": len(resources)}
