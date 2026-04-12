from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, List, Literal

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
    field: List[str] = Field(default_factory=list)
    domain: List[str] = Field(default_factory=list)
    real_examples: List[RealExampleIn] = Field(default_factory=list)
    self_check_questions: List[str] = Field(default_factory=list)
    related_models: List[RelatedModelIn] = Field(default_factory=list)
    scenarios: List[ScenarioIn] = Field(default_factory=list)


class MentalModelCreate(MentalModelBase):
    pass


class MentalModelUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    author: Optional[str] = None
    era: Optional[str] = None
    source_book: Optional[str] = None
    theory: Optional[str] = None
    metaphor: Optional[str] = None
    key_question: Optional[str] = None
    field: Optional[List[str]] = None
    domain: Optional[List[str]] = None
    real_examples: Optional[List[RealExampleIn]] = None
    self_check_questions: Optional[List[str]] = None
    related_models: Optional[List[RelatedModelIn]] = None
    scenarios: Optional[List[ScenarioIn]] = None


class MentalModelOut(MentalModelBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Practice Session ────────────────────────────────────────────────────────

class PracticeSessionCreate(BaseModel):
    model_slug: str
    scenario_type: str = "curated"
    user_response: Optional[str] = None


class PracticeSessionOut(BaseModel):
    id: uuid.UUID
    model_slug: str
    scenario_type: str
    user_response: Optional[str]
    logged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Decision Log ─────────────────────────────────────────────────────────────

class DecisionLogCreate(BaseModel):
    practice_session_id: Optional[uuid.UUID] = None
    model_slugs: List[str] = []
    entry_type: str = "curated"
    domain: Optional[str] = None
    summary: Optional[str] = None
    verdict: Optional[str] = None
    note: Optional[str] = None
    tags: List[str] = []
    revisit_at: Optional[datetime] = None


class DecisionLogUpdate(BaseModel):
    model_slugs: Optional[List[str]] = None
    domain: Optional[str] = None
    summary: Optional[str] = None
    verdict: Optional[str] = None
    note: Optional[str] = None
    tags: Optional[List[str]] = None
    revisit_at: Optional[datetime] = None
    outcome: Optional[str] = None


class DecisionLogOut(BaseModel):
    id: uuid.UUID
    practice_session_id: Optional[uuid.UUID]
    model_slugs: List[str]
    entry_type: str
    domain: Optional[str]
    summary: Optional[str]
    verdict: Optional[str]
    note: Optional[str]
    tags: List[str]
    revisit_at: Optional[datetime]
    outcome: Optional[str]
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
