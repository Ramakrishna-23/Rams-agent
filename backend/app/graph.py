from __future__ import annotations

from neo4j import AsyncGraphDatabase, AsyncDriver

from app.config import get_settings

_driver: AsyncDriver | None = None
_configured: bool | None = None


def get_neo4j_driver() -> AsyncDriver | None:
    global _driver, _configured
    if _configured is False:
        return None
    if _driver is not None:
        return _driver

    settings = get_settings()
    if not settings.neo4j_uri:
        _configured = False
        print("Neo4j not configured, graph features disabled")
        return None

    _driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_username, settings.neo4j_password),
    )
    _configured = True
    return _driver


async def close_neo4j_driver() -> None:
    global _driver, _configured
    if _driver is not None:
        await _driver.close()
        _driver = None
        _configured = None


async def ensure_graph_schema() -> None:
    driver = get_neo4j_driver()
    if driver is None:
        return

    settings = get_settings()
    async with driver.session(database=settings.neo4j_database) as session:
        await session.run(
            "CREATE CONSTRAINT resource_pg_id IF NOT EXISTS "
            "FOR (r:Resource) REQUIRE r.pg_id IS UNIQUE"
        )
        await session.run(
            "CREATE CONSTRAINT tag_name IF NOT EXISTS "
            "FOR (t:Tag) REQUIRE t.name IS UNIQUE"
        )
        await session.run(
            "CREATE CONSTRAINT concept_name IF NOT EXISTS "
            "FOR (c:Concept) REQUIRE c.name IS UNIQUE"
        )
    print("Neo4j connected and schema verified")
