from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceOut
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/search", tags=["search"], dependencies=[Depends(verify_api_key)])


@router.get("", response_model=list[ResourceOut])
async def search_resources(
    q: str = Query(..., min_length=1),
    type: str = Query("hybrid", pattern="^(fulltext|semantic|hybrid)$"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    if type == "fulltext":
        return await _fulltext_search(db, q, limit)
    elif type == "semantic":
        return await _semantic_search(db, q, limit)
    else:
        return await _hybrid_search(db, q, limit)


async def _fulltext_search(db: AsyncSession, query: str, limit: int) -> list[Resource]:
    stmt = (
        select(Resource)
        .where(Resource.search_vector.op("@@")(func.plainto_tsquery("english", query)))
        .order_by(
            func.ts_rank(Resource.search_vector, func.plainto_tsquery("english", query)).desc()
        )
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().unique().all()


async def _semantic_search(db: AsyncSession, query: str, limit: int) -> list[Resource]:
    from app.services.embeddings import generate_embedding

    query_embedding = await generate_embedding(query)
    stmt = (
        select(Resource)
        .where(Resource.embedding.isnot(None))
        .order_by(Resource.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().unique().all()


async def _hybrid_search(db: AsyncSession, query: str, limit: int) -> list[Resource]:
    """Reciprocal Rank Fusion of full-text and semantic results."""
    ft_results = await _fulltext_search(db, query, limit * 2)
    sem_results = await _semantic_search(db, query, limit * 2)

    k = 60  # RRF constant
    scores: dict[str, float] = {}
    resource_map: dict[str, Resource] = {}

    for rank, r in enumerate(ft_results):
        rid = str(r.id)
        scores[rid] = scores.get(rid, 0) + 1.0 / (k + rank + 1)
        resource_map[rid] = r

    for rank, r in enumerate(sem_results):
        rid = str(r.id)
        scores[rid] = scores.get(rid, 0) + 1.0 / (k + rank + 1)
        resource_map[rid] = r

    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)[:limit]
    return [resource_map[rid] for rid in sorted_ids]
