from django import forms
from django.contrib import admin, messages

from .models import CommonProblem, District, Faq, LegalPage, Review, Service, ServiceArea, SitePhoto, SubService, Town


class LinesField(forms.CharField):
    """Edits a JSON list of strings as one item per line."""

    widget = forms.Textarea(attrs={"rows": 4})

    def prepare_value(self, value):
        return "\n".join(value) if isinstance(value, list) else value

    def to_python(self, value):
        return [line.strip() for line in (value or "").splitlines() if line.strip()]


class ServiceAreaForm(forms.ModelForm):
    types = LinesField(required=False, help_text="One per line, e.g. Split AC. Leave empty to hide the block.")
    brands = LinesField(
        required=False, help_text="Confirmed brands only, one per line. Plain names, no logos. Empty hides the block."
    )
    areas_covered = LinesField(required=False, help_text="Localities covered, one per line.")

    class Meta:
        model = ServiceArea
        fields = "__all__"


class SubServiceInline(admin.TabularInline):
    model = SubService
    extra = 0


class CommonProblemInline(admin.TabularInline):
    model = CommonProblem
    extra = 0


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_popular", "is_featured", "is_active", "sort_order"]
    list_editable = ["is_popular", "is_featured", "is_active", "sort_order"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [SubServiceInline, CommonProblemInline]


class TownInline(admin.TabularInline):
    model = Town
    extra = 0
    prepopulated_fields = {"slug": ["name"]}


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "tagline", "sort_order"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [TownInline]


@admin.register(Town)
class TownAdmin(admin.ModelAdmin):
    list_display = ["name", "district", "slug", "is_active", "sort_order"]
    list_filter = ["district", "is_active"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(ServiceArea)
class ServiceAreaAdmin(admin.ModelAdmin):
    form = ServiceAreaForm
    list_display = ["title", "service", "town", "is_published", "updated_at"]
    list_editable = ["is_published"]
    list_filter = ["is_published", "service", "town__district"]
    search_fields = ["title", "town__name", "service__name"]
    list_select_related = ["service", "town"]
    actions = ["publish", "unpublish", "copy_types_and_brands"]
    fieldsets = [
        (None, {"fields": ["service", "town", "is_published"]}),
        ("Page copy", {"fields": ["title", "intro", "hero_image", "hero_image_alt"]}),
        ("Blocks", {"fields": ["types", "brands", "areas_covered"]}),
        ("Search engines", {"fields": ["meta_title", "meta_description"]}),
    ]

    @admin.action(description="Publish selected pages")
    def publish(self, request, queryset):
        for area in queryset:  # save() so revalidation signals fire
            area.is_published = True
            area.save(update_fields=["is_published", "updated_at"])

    @admin.action(description="Copy types & brands from the selected page to all towns for that service")
    def copy_types_and_brands(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, "Select exactly one page to copy from.", level=messages.WARNING)
            return
        source = queryset.get()
        targets = ServiceArea.objects.filter(service=source.service).exclude(pk=source.pk)
        for area in targets:  # save() so revalidation signals fire
            area.types, area.brands = source.types, source.brands
            area.save(update_fields=["types", "brands", "updated_at"])
        self.message_user(request, f"Copied to {targets.count()} {source.service.name} pages.")

    @admin.action(description="Unpublish selected pages")
    def unpublish(self, request, queryset):
        for area in queryset:
            area.is_published = False
            area.save(update_fields=["is_published", "updated_at"])


@admin.register(Faq)
class FaqAdmin(admin.ModelAdmin):
    list_display = ["question", "scope", "service", "district", "is_published", "sort_order"]
    list_editable = ["is_published", "sort_order"]
    list_filter = ["scope", "is_published", "service", "district"]
    search_fields = ["question", "answer"]
    autocomplete_fields = ["service_area"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["name", "service", "town", "source", "rating", "is_published", "created_at"]
    list_editable = ["is_published"]
    list_filter = ["is_published", "source", "service"]
    search_fields = ["name", "text"]


@admin.register(SitePhoto)
class SitePhotoAdmin(admin.ModelAdmin):
    list_display = ["slot", "alt"]


@admin.register(LegalPage)
class LegalPageAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "is_published", "updated_at"]
