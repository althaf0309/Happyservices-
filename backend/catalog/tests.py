from unittest import mock

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Faq, Review, ServiceArea


class CatalogApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)

    def setUp(self):
        self.client = APIClient()

    def test_seed_counts(self):
        services = self.client.get("/api/v1/services").json()
        locations = self.client.get("/api/v1/locations").json()
        self.assertEqual(len(services), 11)
        self.assertEqual(len(locations), 3)
        self.assertEqual(sum(len(d["towns"]) for d in locations), 10)

    def test_seed_is_create_only(self):
        area = ServiceArea.objects.get(service__slug="ac-service", town__slug="guruvayoor")
        area.intro = "Edited by the owner"
        area.save()
        call_command("seed_catalog", verbosity=0)
        area.refresh_from_db()
        self.assertEqual(area.intro, "Edited by the owner")

    def test_camel_case_on_the_wire(self):
        service = self.client.get("/api/v1/services").json()[0]
        self.assertIn("shortDescription", service)
        self.assertIn("isFeatured", service)

    def test_landing_page(self):
        res = self.client.get("/api/v1/pages/thrissur/guruvayoor/ac-service")
        self.assertEqual(res.status_code, 200)
        page = res.json()
        self.assertEqual(page["title"], "AC Service in Guruvayoor")
        self.assertEqual(len(page["subServices"]), 6)
        self.assertEqual(len(page["commonProblems"]), 8)
        self.assertEqual(page["brands"], [])
        self.assertNotIn("Cassette", " ".join(page["types"]))
        # Service-scoped FAQs win over global ones, with {town} filled in.
        questions = [f["question"] for f in page["faqs"]]
        self.assertIn("How do I book AC service in Guruvayoor?", questions)
        self.assertNotIn("Which areas do you cover?", questions)
        nearby = [t["slug"] for t in page["nearby"]["sameServiceTowns"]]
        self.assertIn("kunnamkulam", nearby)
        self.assertNotIn("guruvayoor", nearby)
        self.assertNotIn("kannur-town", nearby)

    def test_unpublished_landing_is_404_and_not_listed(self):
        ServiceArea.objects.filter(service__slug="ac-service", town__slug="guruvayoor").update(is_published=False)
        self.assertEqual(self.client.get("/api/v1/pages/thrissur/guruvayoor/ac-service").status_code, 404)
        published = self.client.get("/api/v1/pages/published").json()
        self.assertNotIn(
            {"district": "thrissur", "town": "guruvayoor", "service": "ac-service"},
            [{k: p[k] for k in ("district", "town", "service")} for p in published],
        )
        # A never-published service (painting) is also 404.
        self.assertEqual(self.client.get("/api/v1/pages/thrissur/guruvayoor/painting").status_code, 404)

    def test_wrong_district_for_town_is_404(self):
        self.assertEqual(self.client.get("/api/v1/pages/kannur/guruvayoor/ac-service").status_code, 404)
        self.assertEqual(self.client.get("/api/v1/locations/kannur/guruvayoor").status_code, 404)

    def test_district_hub(self):
        hub = self.client.get("/api/v1/locations/kannur").json()
        self.assertEqual(hub["district"]["name"], "Kannur")
        self.assertEqual(len(hub["district"]["towns"]), 4)
        self.assertEqual([d["slug"] for d in hub["otherDistricts"]], ["thrissur", "kochi"])
        self.assertEqual(hub["faqs"][0]["question"], "Do you cover Thalassery, Mattanur and Panoor?")
        # Thrissur has no district FAQs, so it falls back to global ones.
        thrissur = self.client.get("/api/v1/locations/thrissur").json()
        self.assertEqual(thrissur["faqs"][0]["question"], "How do I book a service?")

    def test_unpublished_faqs_hidden(self):
        questions = [f["question"] for f in self.client.get("/api/v1/faqs?scope=global").json()]
        self.assertIn("How do I book a service?", questions)
        self.assertNotIn("What are your working hours?", questions)
        self.assertFalse(Faq.objects.get(question="What are your working hours?").is_published)

    def test_reviews_empty_until_published(self):
        self.assertEqual(self.client.get("/api/v1/reviews").json(), [])
        Review.objects.create(name="Real Customer", text="Quick fix.", is_published=False)
        self.assertEqual(self.client.get("/api/v1/reviews").json(), [])

    def test_health_and_schema(self):
        self.assertEqual(self.client.get("/api/v1/health").json(), {"status": "ok"})
        self.assertEqual(self.client.get("/api/v1/schema").status_code, 200)


class ClientContentTests(TestCase):
    """Everything the client still owes can be filled in from the admin."""

    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)

    def setUp(self):
        self.client = APIClient()

    def test_images_are_null_until_uploaded(self):
        self.assertIsNone(self.client.get("/api/v1/services").json()[0]["image"])
        self.assertIsNone(self.client.get("/api/v1/locations").json()[0]["image"])
        self.assertEqual(self.client.get("/api/v1/site-photos").json(), {})

    def test_site_photos_keyed_camel_case_with_absolute_urls(self):
        import tempfile

        from django.core.files.uploadedfile import SimpleUploadedFile

        from .models import SitePhoto

        with tempfile.TemporaryDirectory() as media, self.settings(MEDIA_ROOT=media, PUBLIC_BASE_URL="https://api.example"):
            SitePhoto.objects.create(slot="home_hero", alt="Technician", image=SimpleUploadedFile("hero.png", b"x"))
            photos = self.client.get("/api/v1/site-photos").json()
        # The frontend reads photos.homeHero — keep the wire format camelCase.
        self.assertEqual(list(photos), ["homeHero"])
        self.assertTrue(photos["homeHero"]["url"].startswith("https://api.example/media/site/"))
        self.assertEqual(photos["homeHero"]["alt"], "Technician")

    def test_legal_page_hidden_until_published(self):
        from .models import LegalPage

        page = LegalPage.objects.create(slug="privacy", title="Privacy Policy", body="Client text.")
        self.assertEqual(self.client.get("/api/v1/legal/privacy").status_code, 404)
        page.is_published = True
        page.save()
        res = self.client.get("/api/v1/legal/privacy").json()
        self.assertEqual(res["body"], "Client text.")
        self.assertIn("updatedAt", res)

    def test_copy_types_and_brands_admin_action(self):
        from django.contrib.admin.sites import site

        source = ServiceArea.objects.get(service__slug="ac-service", town__slug="guruvayoor")
        source.brands = ["Brand A", "Brand B"]
        source.types = ["Split AC", "Cassette AC"]
        source.save()
        admin = site._registry[ServiceArea]
        with mock.patch.object(admin, "message_user"):
            admin.copy_types_and_brands(request=None, queryset=ServiceArea.objects.filter(pk=source.pk))
        other = ServiceArea.objects.get(service__slug="ac-service", town__slug="kannur-town")
        self.assertEqual(other.brands, ["Brand A", "Brand B"])
        self.assertEqual(other.types, ["Split AC", "Cassette AC"])
        # Other services untouched
        self.assertEqual(ServiceArea.objects.get(service__slug="plumbing", town__slug="kannur-town").brands, [])
