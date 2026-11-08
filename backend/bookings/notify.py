from urllib.parse import quote

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.html import escape


def customer_whatsapp_url(booking) -> str:
    text = (
        f"Hi {booking.name}, this is Happy Services about your {booking.service.name} request "
        f"({booking.reference})."
    )
    return f"https://wa.me/91{booking.phone}?text={quote(text)}"


def send_new_booking_email(booking) -> None:
    created = timezone.localtime(booking.created_at).strftime("%d %b %Y, %I:%M %p")
    rows = [
        ("Reference", booking.reference),
        ("Name", booking.name),
        ("Phone", f"+91 {booking.phone}"),
        ("Service", booking.service.name),
        ("Location", booking.location_label),
        ("Preferred time", booking.get_preferred_time_display()),
        ("Problem", booking.problem or "—"),
        ("Received", created),
        ("Page", booking.page_url or "—"),
    ]
    whatsapp = customer_whatsapp_url(booking)
    text_body = "\n".join(f"{label}: {value}" for label, value in rows) + f"\n\nReply on WhatsApp: {whatsapp}\n"

    html_rows = "".join(
        f"<tr><td style='padding:4px 12px 4px 0;color:#3B4558'>{label}</td>"
        f"<td style='padding:4px 0;color:#111A2E'>{escape(value)}</td></tr>"
        for label, value in rows
    )
    html_body = (
        "<div style='font-family:Arial,sans-serif;font-size:15px'>"
        f"<h2 style='color:#1F3C88;margin:0 0 12px'>New booking {escape(booking.reference)}</h2>"
        f"<table>{html_rows}</table>"
        "<p style='margin-top:16px'>"
        f"<a href='tel:+91{booking.phone}' style='color:#1F3C88;font-weight:bold'>Call +91 {booking.phone}</a>"
        " &nbsp;·&nbsp; "
        f"<a href='{escape(whatsapp)}' style='color:#0B7A43;font-weight:bold'>Reply on WhatsApp</a>"
        "</p></div>"
    )

    message = EmailMultiAlternatives(
        subject=f"New booking: {booking.service.name} · {booking.location_label} · {booking.reference}",
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=settings.NOTIFY_EMAIL_TO,
    )
    message.attach_alternative(html_body, "text/html")
    message.send()
