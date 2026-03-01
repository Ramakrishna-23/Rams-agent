from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import resources, chat, search, reminders, digest


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    print(f"Starting {settings.app_name}...")
    yield
    print("Shutting down...")


app = FastAPI(title="Personal Resource Agent", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resources.router)
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(reminders.router)
app.include_router(digest.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
