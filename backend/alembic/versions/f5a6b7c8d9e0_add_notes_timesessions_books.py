"""add notes, time_sessions, books

Revision ID: f5a6b7c8d9e0
Revises: e4f5g6h7i8j9
Create Date: 2026-03-17 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "f5a6b7c8d9e0"
down_revision = "e4f5g6h7i8j9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Notes table
    op.create_table(
        "notes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False, server_default="Untitled"),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "note_tags",
        sa.Column("note_id", UUID(as_uuid=True), sa.ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", UUID(as_uuid=True), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )

    # Time sessions table
    op.create_table(
        "time_sessions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "project_id",
            UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_time_sessions_project_id", "time_sessions", ["project_id"])

    # Books table
    op.create_table(
        "books",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("author", sa.String(500), nullable=True),
        sa.Column("cover_url", sa.String(2048), nullable=True),
        sa.Column("isbn", sa.String(20), nullable=True),
        sa.Column("genre", sa.String(100), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="want_to_read"),
        sa.Column("total_chapters", sa.Integer(), nullable=True),
        sa.Column("current_chapter", sa.Integer(), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_table(
        "book_tags",
        sa.Column("book_id", UUID(as_uuid=True), sa.ForeignKey("books.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", UUID(as_uuid=True), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("book_tags")
    op.drop_table("books")
    op.drop_index("ix_time_sessions_project_id", table_name="time_sessions")
    op.drop_table("time_sessions")
    op.drop_table("note_tags")
    op.drop_table("notes")
