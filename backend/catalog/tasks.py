import json
import logging
import urllib.request

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(autoretry_for=(OSError,), retry_backoff=True, max_retries=3)
def revalidate_frontend():
    """Ask the Next.js site to rebuild its cached pages (on-demand ISR)."""
    if not settings.FRONTEND_REVALIDATE_URL or not settings.REVALIDATE_SECRET:
        return
    request = urllib.request.Request(
        settings.FRONTEND_REVALIDATE_URL,
        data=json.dumps({"secret": settings.REVALIDATE_SECRET}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        logger.info("Frontend revalidated (%s)", response.status)
