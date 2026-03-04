"""add action and favorite statuses to resource_status enum

Revision ID: b1a2c3d4e5f6
Revises: a664e5778449
Create Date: 2026-03-02 00:00:00.000000
"""

from alembic import op

revision = "b1a2c3d4e5f6"
down_revision = "a664e5778449"
branch_labels = None
depends_on = None

NEW_VALUES = ["favorite", "about_to_do", "lets_do", "doing", "done", "archive"]


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL,
    # so we commit the current transaction first, then run each statement.
    op.execute("COMMIT")
    for value in NEW_VALUES:
        op.execute(f"ALTER TYPE resource_status ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    # PostgreSQL does not support removing values from an enum type.
    # A full recreate-and-migrate would be needed; leaving as no-op.
    pass
