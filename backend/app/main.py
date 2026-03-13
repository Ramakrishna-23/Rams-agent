from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import resources, chat, search, reminders, digest, graph as graph_router
from app.routers import subtasks, push
from app.graph import ensure_graph_schema, close_neo4j_driver


async def _notification_loop():
    """Background loop that checks for due notifications every 5 minutes."""
    from app.services.notifications import check_and_send_notifications
    while True:
        try:
            await check_and_send_notifications()
        except Exception as e:
            print(f"Notification check failed: {e}")
        await asyncio.sleep(300)  # 5 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    print(f"Starting {settings.app_name}...")
    try:
        await ensure_graph_schema()
    except Exception as e:
        print(f"Neo4j connection failed (non-fatal): {e}")

    # Start notification background task if VAPID is configured
    notification_task = None
    if settings.vapid_private_key:
        notification_task = asyncio.create_task(_notification_loop())
        print("Push notification loop started")

    yield

    if notification_task:
        notification_task.cancel()
    await close_neo4j_driver()
    print("Shutting down...")


settings = get_settings()
app = FastAPI(title="Personal Resource Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resources.router)
app.include_router(resources.router_tags)
app.include_router(resources.router_quick)
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(reminders.router)
app.include_router(digest.router)
app.include_router(graph_router.router)
app.include_router(subtasks.router)
app.include_router(push.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
