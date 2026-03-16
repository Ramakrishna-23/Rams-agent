"""add projects and comments

Revision ID: e4f5g6h7i8j9
Revises: d3c4e5f6g7h8
Create Date: 2026-03-16 00:00:00.000000

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "e4f5g6h7i8j9"
down_revision = "d3c4e5f6g7h8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.add_column(
        "resources",
        sa.Column(
            "project_id",
            UUID(as_uuid=True),
            sa.ForeignKey("projects.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_resources_project_id", "resources", ["project_id"])

    op.create_table(
        "resource_comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "resource_id",
            UUID(as_uuid=True),
            sa.ForeignKey("resources.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_resource_comments_resource_id", "resource_comments", ["resource_id"])


def downgrade() -> None:
    op.drop_index("ix_resource_comments_resource_id", table_name="resource_comments")
    op.drop_table("resource_comments")
    op.drop_index("ix_resources_project_id", table_name="resources")
    op.drop_column("resources", "project_id")
    op.drop_table("projects")
