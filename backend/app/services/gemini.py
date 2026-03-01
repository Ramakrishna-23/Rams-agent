from __future__ import annotations

from google import genai

from app.config import get_settings

_client = None


def get_gemini_client() -> genai.Client:
    global _client
    if _client is None:
        settings = get_settings()
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


async def summarize_content(content: str, title: str = "") -> str:
    """Generate a concise summary of the content using Gemini."""
    client = get_gemini_client()
    settings = get_settings()

    prompt = f"""Summarize the following web content concisely in 2-4 sentences.
Focus on the key ideas and takeaways.

Title: {title}
Content: {content[:8000]}"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )
    return response.text


async def generate_tags(content: str, title: str = "") -> list[str]:
    """Generate relevant tags for the content using Gemini."""
    client = get_gemini_client()
    settings = get_settings()

    prompt = f"""Generate 3-7 relevant tags for the following web content.
Return ONLY a comma-separated list of lowercase tags, nothing else.
Example: python, machine-learning, tutorial

Title: {title}
Content: {content[:4000]}"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )
    tags = [t.strip().lower() for t in response.text.strip().split(",") if t.strip()]
    return tags[:7]
