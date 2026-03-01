from __future__ import annotations

"""Background resource processing — scrape, summarize, tag, embed."""
from sqlalchemy import select, text as sa_text, func

from app.database import async_session
from app.models.resource import Resource, Tag, resource_tags
from app.services.scraper import scrape_url
from app.services.gemini import summarize_content, generate_tags
from app.services.embeddings import generate_embedding


async def process_resource(resource_id: str):
    """Full processing pipeline for a newly saved resource."""
    async with async_session() as db:
        result = await db.execute(select(Resource).where(Resource.id == resource_id))
        resource = result.scalar_one_or_none()
        if not resource:
            return

        try:
            # 1. Scrape
            scraped = await scrape_url(resource.url)
            resource.scraped_content = scraped["content"]
            if not resource.title and scraped["title"]:
                resource.title = scraped["title"]

            content = scraped["content"]
            if not content:
                resource.summary = "Could not extract content from this URL."
                await db.commit()
                return

            # 2. Summarize
            resource.summary = await summarize_content(content, resource.title or "")

            # 3. Generate tags
            tag_names = await generate_tags(content, resource.title or "")
            for tag_name in tag_names:
                tag_result = await db.execute(select(Tag).where(Tag.name == tag_name))
                tag = tag_result.scalar_one_or_none()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.add(tag)
                    await db.flush()
                resource.tags.append(tag)

            # 4. Generate embedding
            embed_text = f"{resource.title or ''}\n{resource.summary}\n{content[:4000]}"
            resource.embedding = await generate_embedding(embed_text)

            # 5. Update search vector
            search_content = f"{resource.title or ''} {resource.summary or ''} {content[:4000]}"
            from sqlalchemy import cast, String
            from sqlalchemy.dialects.postgresql import TSVECTOR
            from sqlalchemy import update
            await db.execute(
                update(Resource)
                .where(Resource.id == resource_id)
                .values(search_vector=func.to_tsvector("english", search_content))
            )

            await db.commit()
            print(f"Successfully processed resource {resource_id}")
        except Exception as e:
            print(f"Error processing resource {resource_id}: {e}")
            await db.rollback()
            # Save error in a fresh transaction
            async with async_session() as db2:
                result2 = await db2.execute(select(Resource).where(Resource.id == resource_id))
                res = result2.scalar_one_or_none()
                if res:
                    res.summary = f"Processing failed: {str(e)[:500]}"
                    await db2.commit()
