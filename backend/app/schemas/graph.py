from __future__ import annotations

from pydantic import BaseModel


class RelatedResourceOut(BaseModel):
    pg_id: str
    title: str | None = None
    url: str | None = None
    score: float | None = None
    shared_via: str | None = None


class GraphPathOut(BaseModel):
    nodes: list[dict]
    edges: list[dict]


class GraphStatsOut(BaseModel):
    resource_count: int = 0
    tag_count: int = 0
    concept_count: int = 0
    relationship_count: int = 0
