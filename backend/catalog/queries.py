from django.db.models import Prefetch

from .models import District, Service, ServiceArea, Town


def active_services():
    return Service.objects.filter(is_active=True)


def active_towns():
    return Town.objects.filter(is_active=True).select_related("district")


def districts_with_towns():
    return District.objects.prefetch_related(Prefetch("towns", queryset=active_towns(), to_attr="active_towns"))


def published_areas():
    """Landing pages that may be shown: published, with an active service and town."""
    return ServiceArea.objects.filter(is_published=True, service__is_active=True, town__is_active=True)
