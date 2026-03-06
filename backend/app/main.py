from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import resources, chat, search, reminders, digest, graph as graph_router
from app.graph import ensure_graph_schema, close_neo4j_driver


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    print(f"Starting {settings.app_name}...")
    try:
        await ensure_graph_schema()
    except Exception as e:
        print(f"Neo4j connection failed (non-fatal): {e}")
    yield
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
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(reminders.router)
app.include_router(digest.router)
app.include_router(graph_router.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
