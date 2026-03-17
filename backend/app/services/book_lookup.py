from __future__ import annotations

import re

import httpx
import trafilatura


async def _lookup_by_isbn(isbn: str) -> dict:
    """Try Open Library, then Google Books to get metadata for a given ISBN/ASIN."""
    # Open Library
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://openlibrary.org/api/books",
                params={"bibkeys": f"ISBN:{isbn}", "format": "json", "jscmd": "data"},
            )
            if resp.status_code == 200:
                data = resp.json()
                key = f"ISBN:{isbn}"
                if key in data:
                    book = data[key]
                    title = book.get("title")
                    authors = book.get("authors", [])
                    author = authors[0]["name"] if authors else None
                    cover = book.get("cover", {})
                    cover_url = cover.get("large") or cover.get("medium") or cover.get("small")
                    description = book.get("notes") or None
                    if isinstance(description, dict):
                        description = description.get("value")
                    return {
                        "title": title,
                        "author": author,
                        "cover_url": cover_url,
                        "isbn": isbn,
                        "description": description,
                    }
    except Exception:
        pass

    # Google Books fallback
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://www.googleapis.com/books/v1/volumes",
                params={"q": f"isbn:{isbn}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                if items:
                    info = items[0].get("volumeInfo", {})
                    title = info.get("title")
                    authors = info.get("authors", [])
                    author = authors[0] if authors else None
                    image_links = info.get("imageLinks", {})
                    cover_url = (
                        image_links.get("extraLarge")
                        or image_links.get("large")
                        or image_links.get("thumbnail")
                    )
                    # Google Books thumbnails use http; upgrade to https
                    if cover_url and cover_url.startswith("http://"):
                        cover_url = cover_url.replace("http://", "https://", 1)
                    description = info.get("description")
                    return {
                        "title": title,
                        "author": author,
                        "cover_url": cover_url,
                        "isbn": isbn,
                        "description": description,
                    }
    except Exception:
        pass

    return {"title": None, "author": None, "cover_url": None, "isbn": isbn, "description": None}


async def lookup_book_from_url(url: str) -> dict:
    """Fetch a book URL and extract metadata for pre-filling the add-book form."""
    # Extract ASIN from Amazon URLs (/dp/<ASIN>)
    asin_match = re.search(r"/dp/([A-Z0-9]{10})", url)
    if asin_match:
        isbn = asin_match.group(1)
        result = await _lookup_by_isbn(isbn)
        if result.get("title"):
            return result

    # Non-Amazon or ASIN lookup failed — fall back to scraping
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        response = await client.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; ResourceAgent/1.0)"},
        )
        response.raise_for_status()
        html = response.text

    metadata = trafilatura.extract_metadata(html)

    title = metadata.title if metadata else None
    author = metadata.author if metadata else None
    cover_url = metadata.image if metadata else None
    description = metadata.description if metadata else None

    isbn: str | None = asin_match.group(1) if asin_match else None

    return {
        "title": title,
        "author": author,
        "cover_url": cover_url,
        "isbn": isbn,
        "description": description,
    }
