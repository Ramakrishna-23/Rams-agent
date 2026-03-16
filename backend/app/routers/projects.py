from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.project import Project, ResourceComment
from app.models.resource import Resource
from app.schemas.project import (
    CommentCreate,
    CommentOut,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
    ProjectWithResourcesOut,
)
from app.utils.auth import verify_api_key

router = APIRouter(prefix="/api/projects", tags=["projects"], dependencies=[Depends(verify_api_key)])
router_comments = APIRouter(prefix="/api", tags=["comments"], dependencies=[Depends(verify_api_key)])


def _to_project_out(p: Project) -> ProjectOut:
    return ProjectOut(
        id=p.id,
        name=p.name,
        description=p.description,
        color=p.color,
        resource_count=len(p.resources),
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


@router.get("", response_model=list[ProjectOut])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    return [_to_project_out(p) for p in projects]


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
