from contextlib import contextmanager

from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import (
    CommonProblem,
    District,
    Faq,
    LegalPage,
    Review,
    Service,
    ServiceArea,
    SitePhoto,
    SubService,
    Town,
)
from .tasks import revalidate_frontend

_CONTENT_MODELS = (
    Service, SubService, District, Town, ServiceArea, CommonProblem, Faq, Review, SitePhoto, LegalPage,
)
_muted = False


@contextmanager
def revalidation_muted():
    """Suppress per-save revalidation during bulk changes such as seeding."""
    global _muted
    _muted = True
    try:
        yield
    finally:
        _muted = False


@receiver(post_save)
@receiver(post_delete)
def content_changed(sender, **kwargs):
    if sender in _CONTENT_MODELS and not _muted:
        transaction.on_commit(revalidate_frontend.delay)
