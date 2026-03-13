from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import async_session
from app.models.push_subscription import PushSubscription
from app.models.reminder import Reminder
from app.models.resource import Resource

logger = logging.getLogger(__name__)


async def send_push_to_all(title: str, body: str, url: str | None = None) -> int:
    """Send a push notification to all subscriptions. Returns count of successful sends."""
    settings = get_settings()
    if not settings.vapid_private_key or not settings.vapid_public_key:
        return 0

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush not installed, skipping push notification")
        return 0

    payload = json.dumps({"title": title, "body": body, "url": url or "/"})
    sent = 0

    async with async_session() as db:
        result = await db.execute(select(PushSubscription))
        subs = result.scalars().all()

        for sub in subs:
            subscription_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh_key,
                    "auth": sub.auth_key,
                },
            }
            try:
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=settings.vapid_private_key,
                    vapid_claims={"sub": f"mailto:{settings.vapid_email}"},
                )
                sent += 1
            except WebPushException as e:
                if "410" in str(e) or "404" in str(e):
                    # Subscription expired, remove it
                    await db.delete(sub)
                else:
                    logger.error(f"Push failed for {sub.endpoint[:50]}: {e}")
            except Exception as e:
                logger.error(f"Push error: {e}")

        await db.commit()

    return sent


async def check_and_send_notifications():
    """Check for due reminders, upcoming deadlines, and overdue reviews. Send push notifications."""
    now = datetime.now(timezone.utc)
    soon = now + timedelta(hours=1)

    async with async_session() as db:
        # 1. Unsent reminders that are due
        result = await db.execute(
            select(Reminder)
            .where(Reminder.is_sent == False, Reminder.remind_at <= now)
        )
        reminders = result.scalars().all()
        for reminder in reminders:
            resource = reminder.resource
            title = resource.title or "Untitled"
            await send_push_to_all(
                title="Reminder",
                body=f"Reminder: {title}",
                url=f"/actions",
            )
            reminder.is_sent = True

        # 2. Tasks due within the next hour (not done)
        result = await db.execute(
            select(Resource)
            .where(
                Resource.due_at != None,
                Resource.due_at <= soon,
                Resource.due_at > now - timedelta(minutes=5),  # Don't re-notify old ones endlessly
                Resource.status.notin_(["done", "archive", "archived"]),
            )
        )
        due_soon = result.scalars().all()
        for resource in due_soon:
            await send_push_to_all(
                title="Due Soon",
                body=f"'{resource.title or 'Untitled'}' is due soon!",
                url=f"/actions",
            )

        # 3. Spaced repetition reviews due
        result = await db.execute(
            select(Resource)
            .where(
                Resource.next_review_at != None,
                Resource.next_review_at <= now,
                Resource.status.notin_(["done", "archive", "archived"]),
            )
            .limit(5)  # Limit to avoid notification spam
        )
        review_due = result.scalars().all()
        if review_due:
            count = len(review_due)
            first_title = review_due[0].title or "Untitled"
            body = f"'{first_title}'" if count == 1 else f"'{first_title}' and {count - 1} more"
            await send_push_to_all(
                title="Review Due",
                body=f"Time to review: {body}",
                url=f"/",
            )

        await db.commit()
