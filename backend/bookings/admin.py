from django.contrib import admin
from django.utils.html import format_html

from .models import Booking, ContactClick
from .views import bookings_csv_response


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ["reference", "created_at", "name", "phone_link", "service", "location", "preferred_time", "status", "source"]
    list_editable = ["status"]
    list_filter = ["status", "service", "town__district", "town", "source", "created_at"]
    list_select_related = ["service", "town"]
    search_fields = ["reference", "name", "phone", "other_location", "problem"]
    date_hierarchy = "created_at"
    actions = ["export_csv", "mark_contacted", "mark_spam"]
    readonly_fields = [
        "id", "reference", "created_at", "updated_at", "page_url", "utm", "source", "ip_hash", "user_agent",
        "whatsapp_link",
    ]
    fieldsets = [
        (None, {"fields": ["reference", "status", "notes"]}),
        ("Customer", {"fields": ["name", "phone", "whatsapp_link", "service", "town", "other_location", "problem", "preferred_time"]}),
        ("Tracking", {"classes": ["collapse"], "fields": ["source", "page_url", "utm", "ip_hash", "user_agent", "id", "created_at", "updated_at"]}),
    ]

    @admin.display(description="Phone", ordering="phone")
    def phone_link(self, obj):
        return format_html('<a href="tel:+91{}">{}</a>', obj.phone, obj.phone)

    @admin.display(description="Location")
    def location(self, obj):
        return obj.location_label

    @admin.display(description="WhatsApp")
    def whatsapp_link(self, obj):
        from .notify import customer_whatsapp_url

        if not obj.pk:
            return "—"
        return format_html('<a href="{}" target="_blank" rel="noopener">Reply on WhatsApp</a>', customer_whatsapp_url(obj))

    @admin.action(description="Export selected to CSV")
    def export_csv(self, request, queryset):
        return bookings_csv_response(queryset)

    @admin.action(description="Mark as contacted")
    def mark_contacted(self, request, queryset):
        queryset.update(status=Booking.Status.CONTACTED)

    @admin.action(description="Mark as spam")
    def mark_spam(self, request, queryset):
        queryset.update(status=Booking.Status.SPAM)


@admin.register(ContactClick)
class ContactClickAdmin(admin.ModelAdmin):
    list_display = ["created_at", "kind", "service", "town", "placement", "page_url"]
    list_filter = ["kind", "service", "town", "placement"]
    date_hierarchy = "created_at"
