from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.note import Note
from app.models.resource import Tag
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/notes", tags=["notes"], dependencies=[Depends(verify_api_key)])


async def _resolve_tags(db: AsyncSession, tag_names: list[str]) -> list[Tag]:
    resolved = []
    for name in tag_names:
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        resolved.append(tag)
    return resolved


@router.get("", response_model=list[NoteOut])
async def list_notes(tag: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(Note)
    if tag:
        q = q.join(Note.tags).where(Tag.name == tag)
    result = await db.execute(q.order_by(Note.updated_at.desc()))
    return result.scalars().all()


@router.post("", response_model=NoteOut, status_code=201)
async def create_note(data: NoteCreate, db: AsyncSession = Depends(get_db)):
    note = Note(id=uuid.uuid4(), title=data.title, content=data.content)
    if data.tag_names:
        note.tags = await _resolve_tags(db, data.tag_names)
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteOut)
async def get_note(note_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.patch("/{note_id}", response_model=NoteOut)
async def update_note(note_id: uuid.UUID, data: NoteUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = data.model_dump(exclude_unset=True)
    tag_names = update_data.pop("tag_names", None)
    for field, value in update_data.items():
        setattr(note, field, value)

    if tag_names is not None:
        note.tags = await _resolve_tags(db, tag_names)

    await db.flush()
    await db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Note).where(Note.id == note_id))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.delete(note)
