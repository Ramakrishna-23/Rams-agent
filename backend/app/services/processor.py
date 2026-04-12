from __future__ import annotations

"""Background resource processing — scrape, summarize, tag, embed."""
from sqlalchemy import func, select

from app.database import async_session
from app.models.resource import Resource, Tag
from app.services.scraper import scrape_url
from app.services.gemini import summarize_content, generate_tags, extract_concepts
from app.services.embeddings import generate_embedding
from app.services.graph_service import sync_resource_to_graph, compute_resource_relationships


async def process_resource(resource_id: str):
    """Full processing pipeline for a newly saved resource."""
    async with async_session() as db:
        result = await db.execute(select(Resource).where(Resource.id == resource_id))
        resource = result.scalar_one_or_none()
        if not resource:
            return

        try:
            # 1. Scrape (or use title/notes for URL-less tasks)
            if resource.url:
                scraped = await scrape_url(resource.url)
                resource.scraped_content = scraped["content"]
                if not resource.title and scraped["title"]:
                    resource.title = scraped["title"]
                content = scraped["content"] or ""
            else:
                content = ""

            if not content:
                # Fall back to title + notes as content for tasks without a URL
                content = " ".join(filter(None, [resource.title, resource.notes]))
                if not content:
                    resource.summary = "No content available."
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
            from sqlalchemy import update
            await db.execute(
                update(Resource)
                .where(Resource.id == resource_id)
                .values(search_vector=func.to_tsvector("english", search_content))
            )

            await db.commit()

            # 6. Best-effort graph sync (after PG commit so PG data is safe)
            try:
                concepts = await extract_concepts(content, resource.title or "")
                await sync_resource_to_graph(
                    str(resource.id),
                    resource.title or "",
                    resource.url,
                    [t.name for t in resource.tags],
                    concepts,
                )
                await compute_resource_relationships(str(resource.id))
            except Exception as e:
                print(f"Graph sync failed for {resource_id}: {e}")

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
