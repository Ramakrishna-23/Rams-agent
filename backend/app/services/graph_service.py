from __future__ import annotations

from app.graph import get_neo4j_driver
from app.config import get_settings


def _db() -> str:
    return get_settings().neo4j_database


async def sync_resource_to_graph(
    resource_id: str,
    title: str,
    url: str,
    tag_names: list[str],
    concepts: list[dict],
) -> None:
    driver = get_neo4j_driver()
    if driver is None:
        return

    async with driver.session(database=_db()) as session:
        # MERGE Resource node
        await session.run(
            "MERGE (r:Resource {pg_id: $pg_id}) "
            "SET r.title = $title, r.url = $url",
            pg_id=resource_id, title=title, url=url,
        )

        # MERGE Tags and TAGGED_WITH relationships
        for tag_name in tag_names:
            await session.run(
                "MERGE (t:Tag {name: $name}) "
                "WITH t "
                "MATCH (r:Resource {pg_id: $pg_id}) "
                "MERGE (r)-[:TAGGED_WITH]->(t)",
                name=tag_name, pg_id=resource_id,
            )

        # MERGE Concepts and MENTIONS relationships
        for concept in concepts:
            await session.run(
                "MERGE (c:Concept {name: $name}) "
                "ON CREATE SET c.description = '' "
                "WITH c "
                "MATCH (r:Resource {pg_id: $pg_id}) "
                "MERGE (r)-[m:MENTIONS]->(c) "
                "SET m.weight = $weight",
                name=concept["name"],
                weight=concept.get("weight", 0.5),
                pg_id=resource_id,
            )


async def compute_resource_relationships(resource_id: str) -> None:
    driver = get_neo4j_driver()
    if driver is None:
        return

    async with driver.session(database=_db()) as session:
        # Find resources sharing >=2 tags or concepts and create RELATED_TO
        await session.run(
            """
            MATCH (r:Resource {pg_id: $pg_id})
            OPTIONAL MATCH (r)-[:TAGGED_WITH]->(t:Tag)<-[:TAGGED_WITH]-(other:Resource)
            WHERE other.pg_id <> $pg_id
            WITH r, other, collect(DISTINCT t.name) AS shared_tags
            WHERE other IS NOT NULL
            OPTIONAL MATCH (r)-[:MENTIONS]->(c:Concept)<-[:MENTIONS]-(other)
            WITH r, other, shared_tags, collect(DISTINCT c.name) AS shared_concepts
            WITH r, other, shared_tags, shared_concepts,
                 size(shared_tags) + size(shared_concepts) AS total_shared
            WHERE total_shared >= 2
            MERGE (r)-[rel:RELATED_TO]-(other)
            SET rel.score = toFloat(total_shared) / 10.0,
                rel.reason = 'shared: ' + reduce(s = '', x IN shared_tags + shared_concepts | s + CASE WHEN s = '' THEN '' ELSE ', ' END + x)
            """,
            pg_id=resource_id,
        )


async def delete_resource_from_graph(resource_id: str) -> None:
    driver = get_neo4j_driver()
    if driver is None:
        return

    async with driver.session(database=_db()) as session:
        await session.run(
            "MATCH (r:Resource {pg_id: $pg_id}) DETACH DELETE r",
            pg_id=resource_id,
        )


async def get_related_resources(resource_id: str, limit: int = 10) -> list[dict]:
    driver = get_neo4j_driver()
    if driver is None:
        return []

    async with driver.session(database=_db()) as session:
        result = await session.run(
            """
            MATCH (r:Resource {pg_id: $pg_id})-[rel:RELATED_TO]-(other:Resource)
            RETURN other.pg_id AS pg_id, other.title AS title, other.url AS url,
                   rel.score AS score, rel.reason AS reason
            ORDER BY rel.score DESC
            LIMIT $limit
            """,
            pg_id=resource_id, limit=limit,
        )
        return [dict(record) async for record in result]


async def find_path_between_resources(id_a: str, id_b: str) -> dict | None:
    driver = get_neo4j_driver()
    if driver is None:
        return None

    async with driver.session(database=_db()) as session:
        result = await session.run(
            """
            MATCH (a:Resource {pg_id: $id_a}), (b:Resource {pg_id: $id_b}),
                  p = shortestPath((a)-[*..6]-(b))
            RETURN [n IN nodes(p) | {labels: labels(n), props: properties(n)}] AS nodes,
                   [r IN relationships(p) | {type: type(r), props: properties(r)}] AS edges
            """,
            id_a=id_a, id_b=id_b,
        )
        record = await result.single()
        if record is None:
            return None
        return {"nodes": record["nodes"], "edges": record["edges"]}


async def get_resources_by_concept(concept_name: str, limit: int = 10) -> list[dict]:
    driver = get_neo4j_driver()
    if driver is None:
        return []

    async with driver.session(database=_db()) as session:
        result = await session.run(
            """
            MATCH (c:Concept {name: $name})<-[m:MENTIONS]-(r:Resource)
            RETURN r.pg_id AS pg_id, r.title AS title, r.url AS url, m.weight AS weight
            ORDER BY m.weight DESC
            LIMIT $limit
            """,
            name=concept_name.lower().strip(), limit=limit,
        )
        return [dict(record) async for record in result]


async def get_graph_stats() -> dict:
    driver = get_neo4j_driver()
    if driver is None:
        return {"resource_count": 0, "tag_count": 0, "concept_count": 0, "relationship_count": 0}

    async with driver.session(database=_db()) as session:
        res = await session.run("MATCH (r:Resource) RETURN count(r) AS c")
        resource_count = (await res.single())["c"]

        res = await session.run("MATCH (t:Tag) RETURN count(t) AS c")
        tag_count = (await res.single())["c"]

        res = await session.run("MATCH (c:Concept) RETURN count(c) AS c")
        concept_count = (await res.single())["c"]

        res = await session.run("MATCH ()-[r:RELATED_TO]-() RETURN count(r) AS c")
        relationship_count = (await res.single())["c"]

        return {
            "resource_count": resource_count,
            "tag_count": tag_count,
            "concept_count": concept_count,
            "relationship_count": relationship_count,
        }
