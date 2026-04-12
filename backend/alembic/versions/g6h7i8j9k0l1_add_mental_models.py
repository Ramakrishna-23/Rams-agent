"""add mental models tables

Revision ID: g6h7i8j9k0l1
Revises: f5a6b7c8d9e0
Create Date: 2026-04-11 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "g6h7i8j9k0l1"
down_revision = "f5a6b7c8d9e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Practice sessions — records each completed daily practice loop
    op.create_table(
        "mm_practice_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("model_slug", sa.String(100), nullable=False),
        sa.Column("scenario_type", sa.String(50), nullable=False, server_default="curated"),
        sa.Column("user_response", sa.Text(), nullable=True),
        sa.Column("logged", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_mm_practice_sessions_created_at", "mm_practice_sessions", ["created_at"])
    op.create_index("ix_mm_practice_sessions_model_slug", "mm_practice_sessions", ["model_slug"])

    # Decision log — persistent log of decisions analysed through mental models
    op.create_table(
        "mm_decision_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "practice_session_id",
            UUID(as_uuid=True),
            sa.ForeignKey("mm_practice_sessions.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("model_slugs", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("entry_type", sa.String(20), nullable=False, server_default="curated"),
        sa.Column("domain", sa.String(50), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("verdict", sa.String(20), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("tags", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("revisit_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("outcome", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_mm_decision_logs_created_at", "mm_decision_logs", ["created_at"])
    op.create_index("ix_mm_decision_logs_revisit_at", "mm_decision_logs", ["revisit_at"])


def downgrade() -> None:
    op.drop_index("ix_mm_decision_logs_revisit_at", table_name="mm_decision_logs")
    op.drop_index("ix_mm_decision_logs_created_at", table_name="mm_decision_logs")
    op.drop_table("mm_decision_logs")
    op.drop_index("ix_mm_practice_sessions_model_slug", table_name="mm_practice_sessions")
    op.drop_index("ix_mm_practice_sessions_created_at", table_name="mm_practice_sessions")
    op.drop_table("mm_practice_sessions")
