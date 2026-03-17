from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.project import Project, ResourceComment
from app.models.resource import Resource
from app.models.time_session import TimeSession
from app.schemas.project import (
    CommentCreate,
    CommentOut,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
    ProjectWithResourcesOut,
    TimeSessionCreate,
    TimeSessionOut,
    TimeSessionsResponse,
)
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/projects", tags=["projects"], dependencies=[Depends(verify_api_key)])
router_comments = APIRouter(prefix="/api", tags=["comments"], dependencies=[Depends(verify_api_key)])


def _to_project_out(p: Project, total_seconds: int = 0) -> ProjectOut:
    return ProjectOut(
        id=p.id,
        name=p.name,
        description=p.description,
        color=p.color,
        resource_count=len(p.resources),
        done_count=sum(1 for r in p.resources if r.status in ("done", "archive")),
        total_seconds=total_seconds,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()

    # Fetch total_seconds per project in one query
    totals_result = await db.execute(
        select(TimeSession.project_id, func.sum(TimeSession.duration_seconds))
        .group_by(TimeSession.project_id)
    )
    totals = {row[0]: row[1] for row in totals_result}

    return [_to_project_out(p, totals.get(p.id, 0)) for p in projects]


@router.post("", response_model=ProjectOut, status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(id=uuid.uuid4(), name=data.name, description=data.description, color=data.color)
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return _to_project_out(project)


@router.get("/{project_id}", response_model=ProjectWithResourcesOut)
async def get_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectWithResourcesOut(
        id=project.id,
        name=project.name,
        description=project.description,
        color=project.color,
        resource_count=len(project.resources),
        done_count=sum(1 for r in project.resources if r.status in ("done", "archive")),
        created_at=project.created_at,
        updated_at=project.updated_at,
        resources=project.resources,
    )


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: uuid.UUID, data: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.flush()
    await db.refresh(project)
    return _to_project_out(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)


# Time-session endpoints
@router.post("/{project_id}/time-sessions", response_model=TimeSessionOut, status_code=201)
async def log_time_session(
    project_id: uuid.UUID, data: TimeSessionCreate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")
    session = TimeSession(
        id=uuid.uuid4(),
        project_id=project_id,
        duration_seconds=data.duration_seconds,
        started_at=data.started_at,
        ended_at=data.ended_at,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/{project_id}/time-sessions", response_model=TimeSessionsResponse)
async def get_time_sessions(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")
    sessions_result = await db.execute(
        select(TimeSession)
        .where(TimeSession.project_id == project_id)
        .order_by(TimeSession.started_at.desc())
    )
    sessions = sessions_result.scalars().all()
    total = sum(s.duration_seconds for s in sessions)
    return TimeSessionsResponse(sessions=list(sessions), total_seconds=total)


# Comments endpoints
@router_comments.post("/resources/{resource_id}/comments", response_model=CommentOut, status_code=201)
async def create_comment(resource_id: uuid.UUID, data: CommentCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Resource not found")
    comment = ResourceComment(id=uuid.uuid4(), resource_id=resource_id, content=data.content)
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


@router_comments.get("/resources/{resource_id}/comments", response_model=list[CommentOut])
async def get_comments(resource_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ResourceComment).where(ResourceComment.resource_id == resource_id)
    )
    return result.scalars().all()


@router_comments.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(comment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ResourceComment).where(ResourceComment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    await db.delete(comment)
