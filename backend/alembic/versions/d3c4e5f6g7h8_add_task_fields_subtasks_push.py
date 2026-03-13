"""add task fields, subtasks table, push_subscriptions table

Revision ID: d3c4e5f6g7h8
Revises: c2b3d4e5f6g7
Create Date: 2026-03-13 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "d3c4e5f6g7h8"
down_revision = "c2b3d4e5f6g7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add task columns to resources
    op.add_column("resources", sa.Column("due_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("resources", sa.Column("priority", sa.Integer(), nullable=True))
    op.add_column("resources", sa.Column("recurrence_rule", sa.String(50), nullable=True))
    op.create_index("ix_resources_due_at", "resources", ["due_at"])

    # Create subtasks table
    op.create_table(
        "subtasks",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("resource_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(512), nullable=False),
        sa.Column("is_done", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_subtasks_resource_id", "subtasks", ["resource_id"])

    # Create push_subscriptions table
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("endpoint", sa.String(2048), unique=True, nullable=False),
        sa.Column("p256dh_key", sa.String(512), nullable=False),
        sa.Column("auth_key", sa.String(512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("push_subscriptions")
    op.drop_index("ix_subtasks_resource_id", table_name="subtasks")
    op.drop_table("subtasks")
    op.drop_index("ix_resources_due_at", table_name="resources")
    op.drop_column("resources", "recurrence_rule")
    op.drop_column("resources", "priority")
    op.drop_column("resources", "due_at")
