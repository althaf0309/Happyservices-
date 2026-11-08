from celery import shared_task

from .models import Booking
from .notify import send_new_booking_email


@shared_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def notify_new_booking(booking_id):
    booking = Booking.objects.select_related("service", "town").get(pk=booking_id)
    send_new_booking_email(booking)
