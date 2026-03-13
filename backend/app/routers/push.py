from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models.push_subscription import PushSubscription
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/push", tags=["push"], dependencies=[Depends(verify_api_key)])


class SubscribeRequest(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str


@router.post("/subscribe", status_code=201)
async def subscribe(data: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    # Upsert: if endpoint exists, update keys
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == data.endpoint)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.p256dh_key = data.p256dh_key
        sub.auth_key = data.auth_key
    else:
        sub = PushSubscription(
            endpoint=data.endpoint,
            p256dh_key=data.p256dh_key,
            auth_key=data.auth_key,
        )
        db.add(sub)
    await db.flush()
    return {"status": "subscribed"}


@router.post("/unsubscribe", status_code=200)
async def unsubscribe(data: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == data.endpoint)
    )
    sub = result.scalar_one_or_none()
    if sub:
        await db.delete(sub)
    return {"status": "unsubscribed"}


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    settings = get_settings()
    if not settings.vapid_public_key:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"public_key": settings.vapid_public_key}
