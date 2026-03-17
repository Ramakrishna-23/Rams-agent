from __future__ import annotations

import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.book import Book
from app.models.resource import Tag
from app.schemas.book import BookCreate, BookLookupOut, BookOut, BookUpdate
from app.services.book_lookup import lookup_book_from_url
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/books", tags=["books"], dependencies=[Depends(verify_api_key)])


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


async def _fetch_cover_url(isbn: str) -> Optional[str]:
    url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.head(url)
            if resp.status_code == 200:
                return url
    except Exception:
        pass
    return None


@router.get("", response_model=list[BookOut])
async def list_books(
    status: Optional[str] = None,
    tag: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Book)
    if status:
        q = q.where(Book.status == status)
    if tag:
        q = q.join(Book.tags).where(Tag.name == tag)
    result = await db.execute(q.order_by(Book.updated_at.desc()))
    return result.scalars().all()


@router.post("", response_model=BookOut, status_code=201)
async def create_book(data: BookCreate, db: AsyncSession = Depends(get_db)):
    cover_url = data.cover_url
    if data.isbn and not cover_url:
        cover_url = await _fetch_cover_url(data.isbn)

    book = Book(
        id=uuid.uuid4(),
        title=data.title,
        author=data.author,
        cover_url=cover_url,
        isbn=data.isbn,
        genre=data.genre,
        status=data.status,
        total_chapters=data.total_chapters,
        current_chapter=data.current_chapter,
        rating=data.rating,
        notes=data.notes,
        started_at=data.started_at,
        finished_at=data.finished_at,
    )
    if data.tag_names:
        book.tags = await _resolve_tags(db, data.tag_names)
    db.add(book)
    await db.flush()
    await db.refresh(book)
    return book


@router.get("/lookup", response_model=BookLookupOut)
async def lookup_book(url: str):
    try:
        data = await lookup_book_from_url(url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {exc}")
    return data


@router.get("/{book_id}", response_model=BookOut)
async def get_book(book_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


@router.patch("/{book_id}", response_model=BookOut)
async def update_book(book_id: uuid.UUID, data: BookUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = data.model_dump(exclude_unset=True)
    tag_names = update_data.pop("tag_names", None)

    new_isbn = update_data.get("isbn")
    if new_isbn and new_isbn != book.isbn and not update_data.get("cover_url"):
        update_data["cover_url"] = await _fetch_cover_url(new_isbn)

    for field, value in update_data.items():
        setattr(book, field, value)

    if tag_names is not None:
        book.tags = await _resolve_tags(db, tag_names)

    await db.flush()
    await db.refresh(book)
    return book


@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    await db.delete(book)
