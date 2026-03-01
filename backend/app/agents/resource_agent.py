from __future__ import annotations

"""ADK Resource Agent — processes newly saved resources."""
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

from app.services.scraper import scrape_url as _scrape_url
from app.services.gemini import summarize_content as _summarize, generate_tags as _generate_tags
from app.services.embeddings import generate_embedding as _generate_embedding


async def scrape_url(url: str) -> dict:
    """Scrape and extract clean text content from a URL.

    Args:
        url: The URL to scrape.

    Returns:
        Dictionary with 'title' and 'content' keys.
    """
    return await _scrape_url(url)


async def summarize_content(content: str, title: str = "") -> str:
    """Generate a concise summary of text content.

    Args:
        content: The text content to summarize.
        title: Optional title for context.

    Returns:
        A concise 2-4 sentence summary.
    """
    return await _summarize(content, title)


async def generate_tags(content: str, title: str = "") -> list[str]:
    """Generate relevant tags for the content.

    Args:
        content: The text content to tag.
        title: Optional title for context.

    Returns:
        A list of 3-7 lowercase tags.
    """
    return await _generate_tags(content, title)


async def store_embedding(text: str) -> list[float]:
    """Generate a 768-dimensional embedding vector for text.

    Args:
        text: The text to embed.

    Returns:
        A list of 768 floats representing the embedding.
    """
    return await _generate_embedding(text)


resource_agent = LlmAgent(
    name="resource_processor",
    model="gemini-2.5-flash",
    instruction="""You process saved web resources. When given a URL:
1. First scrape the URL to extract its content
2. Summarize the extracted content concisely
3. Generate relevant tags for the content
4. Create an embedding from the title, summary, and content

Always complete all 4 steps in order. Report what you did at each step.""",
    tools=[scrape_url, summarize_content, generate_tags, store_embedding],
)
