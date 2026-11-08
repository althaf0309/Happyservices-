from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking


class Command(BaseCommand):
    help = "Delete spam bookings older than SPAM_RETENTION_DAYS (run daily from cron)."

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=settings.SPAM_RETENTION_DAYS)
        deleted, _ = Booking.objects.filter(status=Booking.Status.SPAM, created_at__lt=cutoff).delete()
        self.stdout.write(f"Deleted {deleted} spam booking(s).")
