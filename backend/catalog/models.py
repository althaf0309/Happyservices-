from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Service(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=80)
    short_description = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, blank=True, help_text="Icon key used by the frontend, e.g. 'ac'.")
    is_popular = models.BooleanField(default=False, help_text="Shown in the home 'Popular services' grid.")
    is_featured = models.BooleanField(default=False, help_text="The large 'Most requested' card on the home page.")
    image = models.ImageField(upload_to="services/", blank=True, help_text="Card and service-page photo.")
    image_alt = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class SubService(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="sub_services")
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name


class District(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=60)
    tagline = models.CharField(max_length=120, blank=True)
    summary = models.CharField(max_length=200, blank=True, help_text="One-line card text on the home page.")
    intro = models.TextField(blank=True, help_text="Paragraph under the district hub heading.")
    image = models.ImageField(upload_to="districts/", blank=True, help_text="Region card and district hub photo.")
    image_alt = models.CharField(max_length=160, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Town(models.Model):
    district = models.ForeignKey(District, on_delete=models.PROTECT, related_name="towns")
    # Slugs are globally unique (stricter than the spec's (district, slug)) so the booking
    # API can resolve a town from its slug alone.
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=60)
    blurb = models.CharField(max_length=240, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["district__sort_order", "sort_order", "name"]
        constraints = [models.UniqueConstraint(fields=["district", "slug"], name="unique_town_per_district")]

    def __str__(self):
        return f"{self.name} ({self.district.name})"


class ServiceArea(models.Model):
    """One service × town landing page. Only published rows go live."""

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="service_areas")
    town = models.ForeignKey(Town, on_delete=models.CASCADE, related_name="service_areas")
    title = models.CharField(max_length=120)
    intro = models.TextField()
    meta_title = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=170, blank=True)
    hero_image = models.ImageField(upload_to="landing/", blank=True)
    hero_image_alt = models.CharField(max_length=160, blank=True)
    types = models.JSONField(default=list, blank=True)
    brands = models.JSONField(default=list, blank=True)
    areas_covered = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["town__district__sort_order", "town__sort_order", "service__sort_order"]
        constraints = [models.UniqueConstraint(fields=["service", "town"], name="unique_service_area")]
        verbose_name = "landing page (service × town)"

    def __str__(self):
        return self.title


class CommonProblem(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="common_problems")
    title = models.CharField(max_length=80)
    cause = models.CharField(max_length=160)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.title


class Faq(models.Model):
    class Scope(models.TextChoices):
        GLOBAL = "global", "Global"
        SERVICE = "service", "Service"
        DISTRICT = "district", "District"
        SERVICE_AREA = "service_area", "Landing page"

    scope = models.CharField(max_length=20, choices=Scope.choices, default=Scope.GLOBAL, db_index=True)
    service = models.ForeignKey(Service, null=True, blank=True, on_delete=models.CASCADE, related_name="faqs")
    district = models.ForeignKey(District, null=True, blank=True, on_delete=models.CASCADE, related_name="faqs")
    service_area = models.ForeignKey(
        ServiceArea, null=True, blank=True, on_delete=models.CASCADE, related_name="faqs"
    )
    question = models.CharField(
        max_length=200, help_text="May use {town}, {district} and {service} placeholders."
    )
    answer = models.TextField(help_text="May use {town}, {district} and {service} placeholders.")
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "FAQ"

    def __str__(self):
        return self.question

    def clean(self):
        required = {
            self.Scope.SERVICE: "service",
            self.Scope.DISTRICT: "district",
            self.Scope.SERVICE_AREA: "service_area",
        }.get(self.scope)
        if required and not getattr(self, f"{required}_id"):
            raise ValidationError({required: f"Required for a {self.get_scope_display().lower()} FAQ."})


class Review(models.Model):
    """Real customer reviews only — never placeholder text."""

    name = models.CharField(max_length=80)
    text = models.TextField()
    service = models.ForeignKey(Service, null=True, blank=True, on_delete=models.SET_NULL)
    town = models.ForeignKey(Town, null=True, blank=True, on_delete=models.SET_NULL)
    source = models.CharField(max_length=60, default="Google", help_text="Where the review was left.")
    rating = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}: {self.text[:40]}"


class SitePhoto(models.Model):
    """Photos for fixed slots on the site, e.g. the home hero. Empty slots show a placeholder."""

    class Slot(models.TextChoices):
        HOME_HERO = "home_hero", "Home hero (1120×1200; cropped to 716×480 on mobile)"
        HOME_WHY_US = "home_why_us", "Home 'Why Happy Services' team photo"

    slot = models.CharField(max_length=40, choices=Slot.choices, unique=True)
    image = models.ImageField(upload_to="site/")
    alt = models.CharField(max_length=160, help_text="Describe the photo for screen readers.")

    def __str__(self):
        return self.get_slot_display()


class LegalPage(models.Model):
    """Privacy policy and terms. Until published, the site shows its built-in draft."""

    class Slug(models.TextChoices):
        PRIVACY = "privacy", "Privacy Policy"
        TERMS = "terms", "Terms"

    slug = models.CharField(max_length=20, choices=Slug.choices, unique=True)
    title = models.CharField(max_length=80)
    body = models.TextField(
        help_text="Plain text. Blank line = new paragraph; '## ' starts a heading; '- ' starts a bullet."
    )
    is_published = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
