"""Mental Models router — practice sessions, decision log, and dashboard stats."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.mental_model import PracticeSession, DecisionLog, MentalModel
from app.schemas.mental_model import (
    PracticeSessionCreate,
    PracticeSessionOut,
    DecisionLogCreate,
    DecisionLogUpdate,
    DecisionLogOut,
    DashboardStats,
    MentalModelCreate,
    MentalModelUpdate,
    MentalModelOut,
)
from app.utils.auth import verify_api_key

router = APIRouter(
    prefix="/api/mental-models",
    tags=["mental-models"],
    dependencies=[Depends(verify_api_key)],
)


# ── Mental Model CRUD ─────────────────────────────────────────────────────────

def _serialize_model(entry: MentalModel) -> dict:
    """Dump a MentalModel ORM row into a plain dict for Pydantic validation."""
    return {
        "id": entry.id,
        "slug": entry.slug,
        "name": entry.name,
        "tagline": entry.tagline,
        "author": entry.author,
        "era": entry.era,
        "source_book": entry.source_book,
        "theory": entry.theory,
        "metaphor": entry.metaphor,
        "key_question": entry.key_question,
        "field": entry.field or [],
        "domain": entry.domain or [],
        "real_examples": entry.real_examples or [],
        "self_check_questions": entry.self_check_questions or [],
        "related_models": entry.related_models or [],
        "scenarios": entry.scenarios or [],
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }


@router.get("/models", response_model=List[MentalModelOut])
async def list_mental_models(db: AsyncSession = Depends(get_db)):
    """List all stored mental models."""
    result = await db.execute(select(MentalModel).order_by(MentalModel.created_at.asc()))
    rows = result.scalars().all()
    return [_serialize_model(r) for r in rows]


@router.get("/models/{slug}", response_model=MentalModelOut)
async def get_mental_model(slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch a single mental model by slug."""
    result = await db.execute(select(MentalModel).where(MentalModel.slug == slug))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Mental model not found")
    return _serialize_model(entry)


@router.post("/models", response_model=MentalModelOut, status_code=201)
async def create_mental_model(
    data: MentalModelCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new mental model."""
    existing = await db.execute(select(MentalModel).where(MentalModel.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Mental model with slug '{data.slug}' already exists")

    entry = MentalModel(
        id=uuid.uuid4(),
        slug=data.slug,
        name=data.name,
        tagline=data.tagline,
        author=data.author,
        era=data.era,
        source_book=data.source_book,
        theory=data.theory,
        metaphor=data.metaphor,
        key_question=data.key_question,
        field=data.field,
        domain=data.domain,
        real_examples=[e.model_dump() for e in data.real_examples],
        self_check_questions=data.self_check_questions,
        related_models=[r.model_dump() for r in data.related_models],
        scenarios=[s.model_dump() for s in data.scenarios],
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return _serialize_model(entry)


@router.patch("/models/{slug}", response_model=MentalModelOut)
async def update_mental_model(
    slug: str,
    data: MentalModelUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update fields on an existing mental model."""
    result = await db.execute(select(MentalModel).where(MentalModel.slug == slug))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Mental model not found")

    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        if field in ("real_examples", "related_models", "scenarios") and value is not None:
            value = [v.model_dump() if hasattr(v, "model_dump") else v for v in value]
        setattr(entry, field, value)

    await db.flush()
    await db.refresh(entry)
    return _serialize_model(entry)


@router.delete("/models/{slug}", status_code=204)
async def delete_mental_model(slug: str, db: AsyncSession = Depends(get_db)):
    """Delete a mental model."""
    result = await db.execute(select(MentalModel).where(MentalModel.slug == slug))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Mental model not found")
    await db.delete(entry)


# ── Practice Sessions ─────────────────────────────────────────────────────────

@router.post("/practice/session", response_model=PracticeSessionOut, status_code=201)
async def create_practice_session(
    data: PracticeSessionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Record a completed practice session."""
    session = PracticeSession(
        id=uuid.uuid4(),
        model_slug=data.model_slug,
        scenario_type=data.scenario_type,
        user_response=data.user_response,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/practice/sessions", response_model=List[PracticeSessionOut])
async def list_practice_sessions(
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
):
    """List recent practice sessions."""
    result = await db.execute(
        select(PracticeSession)
        .order_by(PracticeSession.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ── Decision Log ──────────────────────────────────────────────────────────────

@router.get("/decision-log", response_model=List[DecisionLogOut])
async def list_decision_log(
    entry_type: Optional[str] = None,
    domain: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List decision log entries, optionally filtered."""
    q = select(DecisionLog)
    if entry_type:
        q = q.where(DecisionLog.entry_type == entry_type)
    if domain:
        q = q.where(DecisionLog.domain == domain)
    q = q.order_by(DecisionLog.created_at.desc()).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/decision-log", response_model=DecisionLogOut, status_code=201)
async def create_decision_log_entry(
    data: DecisionLogCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new decision log entry."""
    if data.practice_session_id:
        result = await db.execute(
            select(PracticeSession).where(PracticeSession.id == data.practice_session_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Practice session not found")

    entry = DecisionLog(
        id=uuid.uuid4(),
        practice_session_id=data.practice_session_id,
        model_slugs=data.model_slugs,
        entry_type=data.entry_type,
        domain=data.domain,
        summary=data.summary,
        verdict=data.verdict,
        note=data.note,
        tags=data.tags,
        revisit_at=data.revisit_at,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)

    if data.practice_session_id:
        result = await db.execute(
            select(PracticeSession).where(PracticeSession.id == data.practice_session_id)
        )
        ps = result.scalar_one_or_none()
        if ps:
            ps.logged = True
            await db.flush()

    return entry


@router.get("/decision-log/{entry_id}", response_model=DecisionLogOut)
async def get_decision_log_entry(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single decision log entry."""
    result = await db.execute(select(DecisionLog).where(DecisionLog.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Decision log entry not found")
    return entry


@router.patch("/decision-log/{entry_id}", response_model=DecisionLogOut)
async def update_decision_log_entry(
    entry_id: uuid.UUID,
    data: DecisionLogUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a decision log entry (verdict, outcome, note, etc.)."""
    result = await db.execute(select(DecisionLog).where(DecisionLog.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Decision log entry not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)

    await db.flush()
    await db.refresh(entry)
    return entry


@router.delete("/decision-log/{entry_id}", status_code=204)
async def delete_decision_log_entry(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a decision log entry."""
    result = await db.execute(select(DecisionLog).where(DecisionLog.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Decision log entry not found")
    await db.delete(entry)


# ── Dashboard Stats ───────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Aggregate dashboard statistics."""
    now = datetime.now(timezone.utc)

    # Total sessions
    total_sessions_result = await db.execute(select(func.count()).select_from(PracticeSession))
    total_sessions = total_sessions_result.scalar_one() or 0

    # All practice session dates for streak calculation
    sessions_result = await db.execute(
        select(PracticeSession.created_at).order_by(PracticeSession.created_at.asc())
    )
    all_session_datetimes = sessions_result.scalars().all()

    # Build date → count map
    sessions_by_date: dict[str, int] = defaultdict(int)
    for dt in all_session_datetimes:
        date_str = dt.date().isoformat()
        sessions_by_date[date_str] += 1

    # Streak calculation (with 1-grace-day)
    current_streak = 0
    best_streak = 0
    if sessions_by_date:
        sorted_dates = sorted(sessions_by_date.keys())
        today = now.date()

        # Build streak from today backwards
        streak = 0
        check_date = today
        missed_days = 0
        while True:
            date_str = check_date.isoformat()
            if date_str in sessions_by_date:
                streak += 1
                missed_days = 0
            else:
                missed_days += 1
                if missed_days > 1:
                    break
            check_date -= timedelta(days=1)
            if check_date < (today - timedelta(days=365)):
                break
        current_streak = streak

        # Best streak ever
        best = 0
        run = 0
        prev_date = None
        grace_used = False
        for d in sorted_dates:
            parsed = datetime.strptime(d, "%Y-%m-%d").date()
            if prev_date is None:
                run = 1
            else:
                delta = (parsed - prev_date).days
                if delta == 1:
                    run += 1
                    grace_used = False
                elif delta == 2 and not grace_used:
                    run += 1
                    grace_used = True
                else:
                    best = max(best, run)
                    run = 1
                    grace_used = False
            prev_date = parsed
        best_streak = max(best, run)

    # Decisions logged
    decisions_result = await db.execute(select(func.count()).select_from(DecisionLog))
    decisions_logged = decisions_result.scalar_one() or 0

    # Distinct model slugs used
    all_log_slugs_result = await db.execute(select(DecisionLog.model_slugs))
    all_log_slugs = all_log_slugs_result.scalars().all()
    unique_models: set[str] = set()
    model_usage: dict[str, int] = defaultdict(int)
    for slugs_list in all_log_slugs:
        for slug in (slugs_list or []):
            unique_models.add(slug)
            model_usage[slug] += 1

    # Also count sessions
    session_slugs_result = await db.execute(select(PracticeSession.model_slug))
    for slug in session_slugs_result.scalars().all():
        unique_models.add(slug)
        model_usage[slug] += 1

    # Revisits due
    revisits_result = await db.execute(
        select(func.count())
        .select_from(DecisionLog)
        .where(DecisionLog.revisit_at <= now)
        .where(DecisionLog.outcome.is_(None))
    )
    revisits_due = revisits_result.scalar_one() or 0

    return DashboardStats(
        current_streak=current_streak,
        best_streak=best_streak,
        total_sessions=total_sessions,
        models_used=len(unique_models),
        decisions_logged=decisions_logged,
        revisits_due=revisits_due,
        sessions_by_date=dict(sessions_by_date),
        model_usage=dict(model_usage),
    )
