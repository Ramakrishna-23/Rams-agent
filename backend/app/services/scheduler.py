from __future__ import annotations

"""Cloud Scheduler / Cloud Tasks integration for production."""
from google.cloud import tasks_v2

from app.config import get_settings


async def enqueue_resource_processing(resource_id: str):
    """Enqueue resource processing via Cloud Tasks (production only)."""
    settings = get_settings()
    if not settings.gcp_project_id:
        # Local dev — process directly
        from app.services.processor import process_resource
        await process_resource(resource_id)
        return

    client = tasks_v2.CloudTasksClient()
    parent = client.queue_path(
        settings.gcp_project_id,
        settings.gcp_location,
        settings.cloud_tasks_queue,
    )

    task = tasks_v2.Task(
        http_request=tasks_v2.HttpRequest(
            http_method=tasks_v2.HttpMethod.POST,
            url=f"{settings.backend_url}/api/internal/process-resource",
            headers={"Content-Type": "application/json", "X-API-Key": settings.api_key},
            body=f'{{"resource_id": "{resource_id}"}}'.encode(),
        )
    )

    client.create_task(parent=parent, task=task)
