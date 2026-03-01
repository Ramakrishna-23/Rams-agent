from __future__ import annotations

import httpx
import trafilatura


async def scrape_url(url: str) -> dict:
    """Fetch and extract clean text content from a URL."""
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        response = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (compatible; ResourceAgent/1.0)"})
        response.raise_for_status()
        html = response.text

    extracted = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=True,
        favor_precision=True,
        output_format="txt",
    )

    metadata = trafilatura.extract_metadata(html)
    title = metadata.title if metadata else None

    return {
        "content": extracted or "",
        "title": title or "",
    }
