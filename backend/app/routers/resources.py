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
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/resources", tags=["resources"], dependencies=[Depends(verify_api_key)])
router_tags = APIRouter(prefix="/api/tags", tags=["tags"], dependencies=[Depends(verify_api_key)])


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
        url=str(data.url),
        title=data.title,
        notes=data.notes,
        status="unread",
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

    await db.flush()
    await db.refresh(resource)
    return resource


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
