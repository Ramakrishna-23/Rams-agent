from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.resource import Resource, Subtask
from app.schemas.resource import SubtaskOut
from app.schemas.subtask import SubtaskCreate, SubtaskUpdate
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api", tags=["subtasks"], dependencies=[Depends(verify_api_key)])


@router.post("/resources/{resource_id}/subtasks", response_model=SubtaskOut, status_code=201)
async def create_subtask(
    resource_id: uuid.UUID,
    data: SubtaskCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Resource not found")

    subtask = Subtask(
        resource_id=resource_id,
        title=data.title,
        sort_order=data.sort_order,
    )
    db.add(subtask)
    await db.flush()
    await db.refresh(subtask)
    return subtask


@router.patch("/subtasks/{subtask_id}", response_model=SubtaskOut)
async def update_subtask(
    subtask_id: uuid.UUID,
    data: SubtaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subtask).where(Subtask.id == subtask_id))
    subtask = result.scalar_one_or_none()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subtask, field, value)

    await db.flush()
    await db.refresh(subtask)
    return subtask


@router.delete("/subtasks/{subtask_id}", status_code=204)
async def delete_subtask(
    subtask_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subtask).where(Subtask.id == subtask_id))
    subtask = result.scalar_one_or_none()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    await db.delete(subtask)
