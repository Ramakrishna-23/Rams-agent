"""add inbox status and make url nullable

Revision ID: c2b3d4e5f6g7
Revises: b1a2c3d4e5f6
Create Date: 2026-03-12 00:00:00.000000
"""

from alembic import op

revision = "c2b3d4e5f6g7"
down_revision = "b1a2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("COMMIT")
    op.execute("ALTER TYPE resource_status ADD VALUE IF NOT EXISTS 'inbox'")
    op.execute("ALTER TABLE resources ALTER COLUMN url DROP NOT NULL")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; url nullable is kept.
    pass
