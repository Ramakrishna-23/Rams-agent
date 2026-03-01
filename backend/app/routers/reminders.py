from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderOut
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/reminders", tags=["reminders"], dependencies=[Depends(verify_api_key)])


@router.post("", response_model=ReminderOut, status_code=201)
async def create_reminder(data: ReminderCreate, db: AsyncSession = Depends(get_db)):
    reminder = Reminder(resource_id=data.resource_id, remind_at=data.remind_at)
    db.add(reminder)
    await db.flush()
    await db.refresh(reminder)
    return reminder


@router.get("", response_model=list[ReminderOut])
async def list_reminders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Reminder).where(Reminder.is_sent == False).order_by(Reminder.remind_at)
    )
    return result.scalars().all()


@router.delete("/{reminder_id}", status_code=204)
async def delete_reminder(reminder_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    await db.delete(reminder)
