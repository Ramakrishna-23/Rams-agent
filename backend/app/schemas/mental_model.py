from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ── Mental Model (library entry) ────────────────────────────────────────────

class RealExampleIn(BaseModel):
    type: Literal["business", "personal", "historical"]
    title: str
    description: str


class ScenarioIn(BaseModel):
    prompt: str
    question: str
    insight: str
    category: Literal["business", "personal", "historical"]


class RelatedModelIn(BaseModel):
    slug: str
    type: Literal["combines_with", "contrasts_with", "prerequisite_for"]


class MentalModelBase(BaseModel):
    slug: str
    name: str
    tagline: str = ""
    author: str = ""
    era: str = ""
    source_book: str = ""
    theory: str = ""
    metaphor: str = ""
    key_question: str = ""
    field: list[str] = Field(default_factory=list)
    domain: list[str] = Field(default_factory=list)
    real_examples: list[RealExampleIn] = Field(default_factory=list)
    self_check_questions: list[str] = Field(default_factory=list)
    related_models: list[RelatedModelIn] = Field(default_factory=list)
    scenarios: list[ScenarioIn] = Field(default_factory=list)


class MentalModelCreate(MentalModelBase):
    pass


class MentalModelUpdate(BaseModel):
    name: str | None = None
    tagline: str | None = None
    author: str | None = None
    era: str | None = None
    source_book: str | None = None
    theory: str | None = None
    metaphor: str | None = None
    key_question: str | None = None
    field: list[str] | None = None
    domain: list[str] | None = None
    real_examples: list[RealExampleIn] | None = None
    self_check_questions: list[str] | None = None
    related_models: list[RelatedModelIn] | None = None
    scenarios: list[ScenarioIn] | None = None


class MentalModelOut(MentalModelBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Practice Session ────────────────────────────────────────────────────────

class PracticeSessionCreate(BaseModel):
    model_slug: str
    scenario_type: str = "curated"
    user_response: str | None = None


class PracticeSessionOut(BaseModel):
    id: uuid.UUID
    model_slug: str
    scenario_type: str
    user_response: str | None
    logged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Decision Log ─────────────────────────────────────────────────────────────

class DecisionLogCreate(BaseModel):
    practice_session_id: uuid.UUID | None = None
    model_slugs: list[str] = []
    entry_type: str = "curated"
    domain: str | None = None
    summary: str | None = None
    verdict: str | None = None
    note: str | None = None
    tags: list[str] = []
    revisit_at: datetime | None = None


class DecisionLogUpdate(BaseModel):
    model_slugs: list[str] | None = None
    domain: str | None = None
    summary: str | None = None
    verdict: str | None = None
    note: str | None = None
    tags: list[str] | None = None
    revisit_at: datetime | None = None
    outcome: str | None = None


class DecisionLogOut(BaseModel):
    id: uuid.UUID
    practice_session_id: uuid.UUID | None
    model_slugs: list[str]
    entry_type: str
    domain: str | None
    summary: str | None
    verdict: str | None
    note: str | None
    tags: list[str]
    revisit_at: datetime | None
    outcome: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Dashboard Stats ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    current_streak: int
    best_streak: int
    total_sessions: int
    models_used: int
    decisions_logged: int
    revisits_due: int
    sessions_by_date: dict  # date string → count
    model_usage: dict       # slug → count
