"""add mm_models table

Revision ID: h7i8j9k0l1m2
Revises: g6h7i8j9k0l1
Create Date: 2026-04-11 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "h7i8j9k0l1m2"
down_revision = "g6h7i8j9k0l1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mm_models",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False, unique=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("tagline", sa.Text(), nullable=False, server_default=""),
        sa.Column("author", sa.String(200), nullable=False, server_default=""),
        sa.Column("era", sa.String(120), nullable=False, server_default=""),
        sa.Column("source_book", sa.String(300), nullable=False, server_default=""),
        sa.Column("theory", sa.Text(), nullable=False, server_default=""),
        sa.Column("metaphor", sa.Text(), nullable=False, server_default=""),
        sa.Column("key_question", sa.Text(), nullable=False, server_default=""),
        sa.Column("field", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("domain", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("real_examples", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("self_check_questions", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("related_models", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("scenarios", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_mm_models_slug", "mm_models", ["slug"])


def downgrade() -> None:
    op.drop_index("ix_mm_models_slug", table_name="mm_models")
    op.drop_table("mm_models")
