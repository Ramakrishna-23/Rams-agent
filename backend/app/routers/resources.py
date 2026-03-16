from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.resource import Resource, Tag
from app.schemas.resource import (
    ResourceCreate,
    ResourceDetail,
    ResourceList,
    ResourceOut,
    ResourceUpdate,
    TagOut,
)
from app.config import get_settings
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/resources", tags=["resources"], dependencies=[Depends(verify_api_key)])
router_tags = APIRouter(prefix="/api/tags", tags=["tags"], dependencies=[Depends(verify_api_key)])
router_quick = APIRouter(prefix="/api", tags=["quick-save"])


@router_tags.get("", response_model=list[TagOut])
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).order_by(Tag.name))
    return result.scalars().all()


@router.post("", response_model=ResourceOut, status_code=201)
async def create_resource(
    data: ResourceCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    resource = Resource(
        url=str(data.url) if data.url else None,
        title=data.title,
        notes=data.notes,
        status="inbox",
        next_review_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add(resource)
    await db.flush()
    await db.refresh(resource)

    # Trigger AI processing in background
    background_tasks.add_task(_process_resource, str(resource.id))

    return resource


async def _process_resource(resource_id: str):
    """Background task to process a resource with the Resource Agent."""
    from app.services.processor import process_resource
    await process_resource(resource_id)


@router.post("/reprocess", status_code=202)
async def reprocess_unembedded(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Trigger re-processing for all resources that have no embedding."""
    result = await db.execute(select(Resource).where(Resource.embedding.is_(None)))
    resources = result.scalars().unique().all()
    for r in resources:
        background_tasks.add_task(_process_resource, str(r.id))
    return {"queued": len(resources)}


@router.get("", response_model=ResourceList)
async def list_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    tag: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Resource)
    count_query = select(func.count(Resource.id))

    if status:
        query = query.where(Resource.status == status)
        count_query = count_query.where(Resource.status == status)
    if tag:
        query = query.join(Resource.tags).where(Tag.name == tag)
        count_query = count_query.join(Resource.tags).where(Tag.name == tag)

    query = query.order_by(Resource.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    resources = result.scalars().unique().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    return ResourceList(items=resources, total=total, page=page, page_size=page_size)


@router.get("/{resource_id}", response_model=ResourceDetail)
async def get_resource(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.patch("/{resource_id}", response_model=ResourceOut)
async def update_resource(
    resource_id: uuid.UUID,
    data: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = data.model_dump(exclude_unset=True)
    tag_names = update_data.pop("tags", None)

    old_status = resource.status
    for field, value in update_data.items():
        setattr(resource, field, value)

    if tag_names is not None:
        resolved_tags = []
        for name in tag_names:
            result2 = await db.execute(select(Tag).where(Tag.name == name))
            tag = result2.scalar_one_or_none()
            if not tag:
                tag = Tag(name=name)
                db.add(tag)
                await db.flush()
            resolved_tags.append(tag)
        resource.tags = resolved_tags

    # Recurring task logic: when moved to "done" and has recurrence_rule
    new_status = update_data.get("status")
    if new_status == "done" and old_status != "done" and resource.recurrence_rule:
        next_due = _calculate_next_due(resource.due_at, resource.recurrence_rule)
        # Copy tag names before creating new resource
        copy_tag_names = [t.name for t in resource.tags]
        new_resource = Resource(
            title=resource.title,
            notes=resource.notes,
            status="about_to_do",
            priority=resource.priority,
            recurrence_rule=resource.recurrence_rule,
            due_at=next_due,
            next_review_at=datetime.now(timezone.utc) + timedelta(days=1),
        )
        db.add(new_resource)
        await db.flush()
        # Copy tags to new resource
        if copy_tag_names:
            new_tags = []
            for name in copy_tag_names:
                tag_result = await db.execute(select(Tag).where(Tag.name == name))
                tag_obj = tag_result.scalar_one_or_none()
                if tag_obj:
                    new_tags.append(tag_obj)
            new_resource.tags = new_tags

    await db.flush()
    await db.refresh(resource)
    return resource


def _calculate_next_due(current_due: datetime | None, rule: str) -> datetime:
    """Calculate next due date based on recurrence rule."""
    base = current_due or datetime.now(timezone.utc)
    if rule == "daily":
        return base + timedelta(days=1)
    elif rule == "weekdays":
        next_day = base + timedelta(days=1)
        while next_day.weekday() >= 5:  # Skip Saturday (5) and Sunday (6)
            next_day += timedelta(days=1)
        return next_day
    elif rule == "weekly":
        return base + timedelta(weeks=1)
    elif rule == "monthly":
        # Move forward ~30 days, land on same day-of-month
        month = base.month % 12 + 1
        year = base.year + (1 if base.month == 12 else 0)
        day = min(base.day, 28)  # Safe day
        return base.replace(year=year, month=month, day=day)
    return base + timedelta(days=1)


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)

    # Best-effort graph cleanup
    try:
        from app.services.graph_service import delete_resource_from_graph
        await delete_resource_from_graph(str(resource_id))
    except Exception as e:
        print(f"Graph delete failed for {resource_id}: {e}")


@router.post("/{resource_id}/review", response_model=ResourceOut)
async def review_resource(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Mark a resource as reviewed and advance spaced repetition."""
    from app.config import get_settings

    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    settings = get_settings()
    resource.review_count += 1
    resource.last_reviewed_at = datetime.now(timezone.utc)
    resource.status = "read"

    # Advance spaced repetition
    intervals = settings.review_intervals
    idx = min(resource.review_count - 1, len(intervals) - 1)
    resource.next_review_at = datetime.now(timezone.utc) + timedelta(days=intervals[idx])

    await db.flush()
    await db.refresh(resource)
    return resource


@router_quick.get("/quick-save")
async def quick_save(
    url: str = Query(...),
    title: str = Query(default=""),
    key: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Save a URL to inbox via GET request. Designed for Apple Shortcuts."""
    from urllib.parse import unquote
    settings = get_settings()
    if unquote(key) != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid key")

    resource = Resource(
        url=url,
        title=title or None,
        status="inbox",
        next_review_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db.add(resource)
    await db.flush()
    await db.refresh(resource)
    return {"saved": True, "title": resource.title or url, "id": str(resource.id)}
