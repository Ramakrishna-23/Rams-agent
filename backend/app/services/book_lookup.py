from __future__ import annotations

import re

import httpx
import trafilatura


async def lookup_book_from_url(url: str) -> dict:
    """Fetch a book URL and extract metadata for pre-filling the add-book form."""
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

    # Amazon: ASIN in /dp/<ASIN> is an ISBN-10
    isbn: str | None = None
    asin_match = re.search(r"/dp/([A-Z0-9]{10})", url)
    if asin_match:
        isbn = asin_match.group(1)

    return {
        "title": title,
        "author": author,
        "cover_url": cover_url,
        "isbn": isbn,
        "description": description,
    }
