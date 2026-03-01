from __future__ import annotations

from app.services.gemini import get_gemini_client
from app.config import get_settings


async def generate_embedding(text: str) -> list[float]:
    """Generate a 768-dim embedding using Gemini embedding model."""
    client = get_gemini_client()
    settings = get_settings()

    # Truncate to avoid token limits
    truncated = text[:8000]

    response = client.models.embed_content(
        model=settings.embedding_model,
        contents=truncated,
        config={"output_dimensionality": settings.embedding_dimensions},
    )
    return response.embeddings[0].values
