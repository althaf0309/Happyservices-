import uuid

from django.db import models


class Booking(models.Model):
    class Status(models.TextChoices):
        NEW = "new"
        CONTACTED = "contacted"
        SCHEDULED = "scheduled"
        COMPLETED = "completed"
        CANCELLED = "cancelled"
        SPAM = "spam"

    class Time(models.TextChoices):
        ANY = "any", "Any time"
        MORNING = "morning"
        AFTERNOON = "afternoon"
        EVENING = "evening"

    class Source(models.TextChoices):
        FORM = "form", "Page form"
        STICKY_FORM = "sticky_form", "Sticky side form"
        BOOK_PAGE = "book_page", "/book page"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=10, db_index=True, help_text="Normalised 10-digit Indian mobile.")
    service = models.ForeignKey("catalog.Service", on_delete=models.PROTECT)
    town = models.ForeignKey("catalog.Town", null=True, blank=True, on_delete=models.SET_NULL)
    other_location = models.CharField(max_length=120, blank=True)
    problem = models.TextField(max_length=1000, blank=True)
    preferred_time = models.CharField(max_length=10, choices=Time.choices, default=Time.ANY)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.NEW, db_index=True)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.FORM)
    page_url = models.URLField(max_length=500, blank=True)
    utm = models.JSONField(default=dict, blank=True)
    ip_hash = models.CharField(max_length=64, blank=True, editable=False)
    user_agent = models.CharField(max_length=300, blank=True, editable=False)
    notes = models.TextField(blank=True, help_text="Internal notes — never shown to the customer.")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self):
        return f"{self.reference} · {self.name}"

    @property
    def location_label(self):
        return self.town.name if self.town else (self.other_location or "—")


class ContactClick(models.Model):
    class Kind(models.TextChoices):
        WHATSAPP = "whatsapp"
        CALL = "call"

    kind = models.CharField(max_length=10, choices=Kind.choices)
    service = models.ForeignKey("catalog.Service", null=True, blank=True, on_delete=models.SET_NULL)
    town = models.ForeignKey("catalog.Town", null=True, blank=True, on_delete=models.SET_NULL)
    placement = models.CharField(max_length=40, blank=True)
    page_url = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
