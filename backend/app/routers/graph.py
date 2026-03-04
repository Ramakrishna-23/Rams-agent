from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.graph import RelatedResourceOut, GraphPathOut, GraphStatsOut
from app.services.graph_service import (
    get_related_resources,
    find_path_between_resources,
    get_resources_by_concept,
    get_graph_stats,
)
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/graph", tags=["graph"], dependencies=[Depends(verify_api_key)])


@router.get("/related/{resource_id}", response_model=list[RelatedResourceOut])
async def related_resources(resource_id: str, limit: int = Query(10, ge=1, le=50)):
    results = await get_related_resources(resource_id, limit)
    return [
        RelatedResourceOut(
            pg_id=r["pg_id"],
            title=r.get("title"),
            url=r.get("url"),
            score=r.get("score"),
            shared_via=r.get("reason"),
        )
        for r in results
    ]


@router.get("/path", response_model=GraphPathOut)
async def shortest_path(
    from_id: str = Query(..., description="Source resource UUID"),
    to_id: str = Query(..., description="Target resource UUID"),
):
    result = await find_path_between_resources(from_id, to_id)
    if result is None:
        raise HTTPException(status_code=404, detail="No path found between the two resources")
    return GraphPathOut(nodes=result["nodes"], edges=result["edges"])


@router.get("/concept/{concept_name}", response_model=list[RelatedResourceOut])
async def resources_by_concept(concept_name: str, limit: int = Query(10, ge=1, le=50)):
    results = await get_resources_by_concept(concept_name, limit)
    return [
        RelatedResourceOut(
            pg_id=r["pg_id"],
            title=r.get("title"),
            url=r.get("url"),
            score=r.get("weight"),
        )
        for r in results
    ]


@router.get("/stats", response_model=GraphStatsOut)
async def graph_statistics():
    stats = await get_graph_stats()
    return GraphStatsOut(**stats)
