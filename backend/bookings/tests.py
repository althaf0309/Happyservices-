import re
import time
from unittest import mock

from django.core import mail
from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Booking
from .utils import normalize_phone

URL = "/api/v1/bookings"


def payload(**overrides):
    data = {
        "name": "Anil Kumar",
        "phone": "+91 98470 12345",
        "service": "ac-service",
        "town": "guruvayoor",
        "problem": "Not cooling, water dripping",
        "preferredTime": "morning",
        "website": "",
        "source": "sticky_form",
        "pageUrl": "https://www.happyservices.in/thrissur/guruvayoor/ac-service",
        "utm": {"utm_source": "google"},
    }
    data.update(overrides)
    return data


class BookingApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_creates_booking_and_emails_owner(self):
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post(URL, payload(), format="json")
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(set(body), {"id", "reference", "status"})
        self.assertEqual(body["status"], "new")
        self.assertRegex(body["reference"], r"^HS-\d{6}-0001$")

        booking = Booking.objects.get(pk=body["id"])
        self.assertEqual(booking.phone, "9847012345")
        self.assertEqual(booking.preferred_time, "morning")
        self.assertEqual(booking.utm, {"utm_source": "google"})
        self.assertTrue(booking.ip_hash)

        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(booking.reference, mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ["newhappyservices@gmail.com"])

    def test_references_count_up(self):
        first = self.client.post(URL, payload(), format="json").json()["reference"]
        second = self.client.post(URL, payload(), format="json").json()["reference"]
        self.assertTrue(first.endswith("-0001") and second.endswith("-0002"))

    def test_invalid_phone_uses_design_copy(self):
        res = self.client.post(URL, payload(phone="98765"), format="json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json(), {"errors": {"phone": ["Please enter a valid 10-digit mobile number."]}})

    def test_other_location_instead_of_town(self):
        res = self.client.post(URL, payload(town=None, otherLocation="Payyanur"), format="json")
        self.assertEqual(res.status_code, 201, res.content)

    def test_location_required(self):
        res = self.client.post(URL, payload(town=None), format="json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["errors"]["town"], ["Choose your location"])

    def test_honeypot_returns_201_and_marks_spam_without_email(self):
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post(URL, payload(website="http://spam.example"), format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["status"], "new")
        self.assertEqual(Booking.objects.get().status, Booking.Status.SPAM)
        self.assertEqual(len(mail.outbox), 0)

    def test_honeypot_with_invalid_data_still_looks_successful(self):
        res = self.client.post(URL, payload(website="x", phone="1"), format="json")
        self.assertEqual(res.status_code, 201)
        self.assertFalse(Booking.objects.exists())

    def test_sixth_booking_from_one_ip_in_ten_minutes_is_throttled(self):
        for _ in range(5):
            self.assertEqual(self.client.post(URL, payload(), format="json").status_code, 201)
        self.assertEqual(self.client.post(URL, payload(), format="json").status_code, 429)

    def test_throttle_window_is_ten_minutes(self):
        for _ in range(5):
            self.client.post(URL, payload(), format="json")
        with mock.patch("rest_framework.throttling.SimpleRateThrottle.timer", return_value=time.time() + 9 * 60):
            self.assertEqual(self.client.post(URL, payload(), format="json").status_code, 429)


class PhoneNormalisationTests(TestCase):
    def test_variants(self):
        cases = {
            "+91 98470 12345": "9847012345",
            "+91-98470-12345": "9847012345",
            "919847012345": "9847012345",
            "09847012345": "9847012345",
            "98470 12345": "9847012345",
            # A real number starting with 91 must not lose its first digits.
            "9123456789": "9123456789",
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(normalize_phone(raw), expected)
                self.assertTrue(re.match(r"^[6-9]\d{9}$", normalize_phone(raw)))


class AdminApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_catalog", verbosity=0)

    def test_requires_staff(self):
        self.assertEqual(APIClient().get("/api/v1/admin/bookings").status_code, 403)

    def test_staff_can_list_update_and_export(self):
        from django.contrib.auth import get_user_model

        cache.clear()
        APIClient().post(URL, payload(), format="json")
        staff = get_user_model().objects.create_user("owner", password="x", is_staff=True)
        client = APIClient()
        client.force_authenticate(staff)

        listing = client.get("/api/v1/admin/bookings?status=new").json()
        self.assertEqual(listing["count"], 1)
        booking_id = listing["results"][0]["id"]

        res = client.patch(f"/api/v1/admin/bookings/{booking_id}", {"status": "contacted", "notes": "Called"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Booking.objects.get().status, "contacted")

        csv = client.get("/api/v1/admin/bookings/export.csv")
        self.assertEqual(csv.status_code, 200)
        self.assertIn("text/csv", csv["Content-Type"])
        self.assertIn("Anil Kumar", csv.content.decode("utf-8-sig"))
