"""Seed the catalogue with the content from the design file.

Idempotent and create-only: re-running adds missing rows but never overwrites copy
edited in the admin, and never touches bookings or reviews.
Copy the client hasn't supplied yet (brands, working hours, pricing, Kochi areas,
cassette/tower AC) is deliberately left empty or unpublished.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import CommonProblem, District, Faq, Service, ServiceArea, SubService, Town
from catalog.signals import revalidation_muted

# slug, name, short description, icon, popular, featured
SERVICES = [
    ("ac-service", "AC Service", "General service, deep cleaning, gas refilling, installation and repair for split and window ACs.", "ac", True, True),
    ("refrigerator-repair", "Refrigerator Repair", "Not cooling, noisy compressor, ice buildup or gas refill.", "fridge", True, False),
    ("washing-machine-repair", "Washing Machine Repair", "Front and top load: drain, spin, motor and door-lock issues.", "washer", True, False),
    ("plumbing", "Plumbing", "Leaks, blocked drains, taps, tanks and bathroom fittings.", "plumbing", True, False),
    ("electrical", "Electrical Services", "Wiring, switchboards, fans, lights and fault finding.", "electrical", True, False),
    ("cctv-installation", "CCTV Installation", "Camera installation and set-up for homes and shops.", "cctv", False, False),
    ("tv-service", "TV Service", "LED and smart TV repair, mounting and set-up.", "tv", False, False),
    ("painting", "Painting", "Interior and exterior painting for homes and flats.", "painting", False, False),
    ("interior-services", "Interior Services", "Interior work and fittings for homes and flats.", "interior", False, False),
    ("welding-fabrication", "Welding & Fabrication", "Gates, grills and metal fabrication work.", "welding", False, False),
    ("gas-pipeline", "Gas Pipeline", "Kitchen gas pipeline installation and leak checks.", "gas", False, False),
]

AC_SUB_SERVICES = [
    ("AC General Service", "Filter, coil and drain cleaning with a performance check."),
    ("AC Repair", "Diagnosis and repair for cooling, electrical and noise faults."),
    ("AC Installation", "Mounting, piping and commissioning of a new split or window AC."),
    ("AC Uninstallation", "Safe removal with gas pumped down, ready to move or reinstall."),
    ("AC Gas Refilling", "Leak check first, then refill to the correct pressure."),
    ("AC Deep Cleaning", "Jet wash of indoor and outdoor coils for smell and weak airflow."),
]

AC_PROBLEMS = [
    ("Not cooling enough", "Clogged filters, low gas or a failing capacitor."),
    ("Water leaking indoors", "Blocked drain pipe or tilted indoor unit."),
    ("Bad smell when switched on", "Mould and dust on the coil and filter."),
    ("Noise or vibration", "Loose panels, fan or compressor mounts."),
    ("Ice on coils or pipes", "Low airflow or low refrigerant."),
    ("Error code or blinking light", "Sensor, PCB or communication faults."),
    ("Trips the breaker", "Electrical fault — switch off and call."),
    ("Remote not responding", "Receiver or control board issue."),
]

# Cassette / tower omitted until the client confirms they are serviced.
AC_TYPES = ["Split AC", "Window AC", "Inverter AC", "Non-inverter AC"]

DISTRICTS = [
    (
        "kannur",
        "Kannur",
        "North Malabar",
        "North Malabar — from the town centre to coastal Thalassery and Mattanur near the airport.",
        "From Kannur Town to coastal Thalassery, Mattanur near the airport and Panoor inland — book AC, "
        "fridge and washing machine repair or plumbing and electrical work with a local Happy Services team.",
        [
            ("kannur-town", "Kannur Town", "The district headquarters — homes, flats and shops in and around the town centre."),
            ("thalassery", "Thalassery", "The coastal heritage town about 20 km south of Kannur, and its surrounding neighbourhoods."),
            ("mattanur", "Mattanur", "Inland town close to Kannur International Airport, with a growing number of new homes."),
            ("panoor", "Panoor", "Town east of Thalassery, serving the surrounding residential areas."),
        ],
    ),
    (
        "thrissur",
        "Thrissur",
        "Central Kerala",
        "Thrissur Town and the temple town of Guruvayoor, plus Irinjalakuda, Kunnamkulam and Chalakudy.",
        "Thrissur Town and the temple town of Guruvayoor, plus Irinjalakuda, Kunnamkulam and Chalakudy — "
        "appliance repair and home services from a local Happy Services team.",
        [
            ("thrissur-town", "Thrissur Town", "The district headquarters — homes and flats across the town."),
            ("guruvayoor", "Guruvayoor", "The temple town — family homes, flats and guest houses."),
            ("irinjalakuda", "Irinjalakuda", "Town south of Thrissur, and its surrounding residential areas."),
            ("kunnamkulam", "Kunnamkulam", "Town west of Thrissur, close to Guruvayoor."),
            ("chalakudy", "Chalakudy", "Town in the south of Thrissur district and its surrounding areas."),
        ],
    ),
    (
        "kochi",
        "Kochi",
        "Ernakulam district",
        "Appliance repair and home services for flats and houses across Kochi.",
        "Appliance repair and home services for flats and houses across Kochi.",
        # Client to add the Kochi areas they serve; until then "Kochi city" only.
        [("kochi-city", "Kochi city", "Flats and houses across Kochi.")],
    ),
]

# Landing pages published at launch; the rest are created unpublished so thin pages never go live.
PUBLISHED_SERVICES = {"ac-service", "refrigerator-repair", "washing-machine-repair", "plumbing", "electrical"}

GURUVAYOOR_AC_INTRO = (
    "Guruvayoor’s warm, humid weather keeps air conditioners running for long hours — in family homes, "
    "flats and the guest houses around the temple town alike. Happy Services handles AC servicing, repairs, "
    "installation and gas refilling across Guruvayoor. Book by phone, WhatsApp or the form."
)

# scope, question, answer, published
GLOBAL_FAQS = [
    ("How do I book a service?", "Choose your service and area, then send the booking form, message us on WhatsApp or call +91 90374 02356. We confirm the visit time with you before the technician comes.", True),
    ("Which areas do you cover?", "Kannur (Kannur Town, Thalassery, Mattanur, Panoor), Thrissur (Thrissur Town, Guruvayoor, Irinjalakuda, Kunnamkulam, Chalakudy) and Kochi. If your area isn’t listed, send your location on WhatsApp and we’ll tell you straight away if a technician can reach you.", True),
    ("Will I know the cost before work starts?", "Yes. The technician inspects the problem, explains what’s wrong and shares the quote before any work begins.", True),
    ("Which AC and appliance brands do you service?", "[Client to confirm the brands serviced]", False),
    ("Can I book on WhatsApp?", "Yes. Message us on WhatsApp with your service and area — you can share photos or a short video of the problem — and we’ll confirm a visit slot.", True),
    ("What are your working hours?", "[Client to confirm working hours]", False),
]

AC_FAQS = [
    ("How often should an AC be serviced in {town}?", "[Client to supply recommended service interval]", False),
    ("How much does AC service cost?", "[Client to supply pricing answer]", False),
    ("Do you refill AC gas?", "Yes. We check for leaks first, then refill to the correct pressure.", True),
    ("How do I book AC service in {town}?", "Send the booking form on this page, message us on WhatsApp — your service and town are filled in for you — or call +91 90374 02356. We confirm the visit time before the technician comes.", True),
]

KANNUR_FAQS = [
    ("Do you cover Thalassery, Mattanur and Panoor?", "Yes. Along with Kannur Town, we cover Thalassery, Mattanur and Panoor.", True),
    ("My area isn’t listed. Can you still come?", "Send your location on WhatsApp and we’ll tell you straight away if a technician can reach you.", True),
    ("Will I get a quote before the work starts?", "Yes. The technician explains the fault and the cost before anything starts.", True),
    ("Which services can I book in Kannur?", "AC service and repair, refrigerator and washing machine repair, TV service, plumbing, electrical work, painting, CCTV installation, interior services, welding and fabrication, and gas pipeline work.", True),
]


def _phrase(name):
    """'AC Service' -> 'AC service', 'Refrigerator Repair' -> 'refrigerator repair'."""
    return " ".join(word if word.isupper() else word.lower() for word in name.split())


class Command(BaseCommand):
    help = "Seed services, districts, towns, landing pages and FAQs from the design."

    @transaction.atomic
    def handle(self, *args, **options):
        with revalidation_muted():
            services = self.seed_services()
            towns = self.seed_locations()
            self.seed_service_areas(services, towns)
            self.seed_faqs(services)
        if options["verbosity"]:
            self.stdout.write(self.style.SUCCESS("Catalogue seeded."))

    def seed_services(self):
        services = {}
        for order, (slug, name, short, icon, popular, featured) in enumerate(SERVICES, start=1):
            services[slug], _ = Service.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "short_description": short,
                    "description": short,
                    "icon": icon,
                    "is_popular": popular,
                    "is_featured": featured,
                    "sort_order": order,
                    "is_active": True,
                },
            )
        ac = services["ac-service"]
        for order, (name, description) in enumerate(AC_SUB_SERVICES, start=1):
            SubService.objects.get_or_create(
                service=ac, name=name, defaults={"description": description, "sort_order": order}
            )
        for order, (title, cause) in enumerate(AC_PROBLEMS, start=1):
            CommonProblem.objects.get_or_create(
                service=ac, title=title, defaults={"cause": cause, "sort_order": order}
            )
        return services

    def seed_locations(self):
        towns = []
        for d_order, (slug, name, tagline, summary, intro, town_rows) in enumerate(DISTRICTS, start=1):
            district, _ = District.objects.get_or_create(
                slug=slug, defaults={"name": name, "tagline": tagline, "summary": summary, "intro": intro, "sort_order": d_order}
            )
            for t_order, (t_slug, t_name, blurb) in enumerate(town_rows, start=1):
                town, _ = Town.objects.get_or_create(
                    slug=t_slug,
                    defaults={"district": district, "name": t_name, "blurb": blurb, "sort_order": t_order, "is_active": True},
                )
                towns.append(town)
        return towns

    def seed_service_areas(self, services, towns):
        for service in services.values():
            for town in towns:
                district = town.district.name
                title = f"{service.name} in {town.name}"
                if service.slug == "ac-service" and town.slug == "guruvayoor":
                    intro = GURUVAYOOR_AC_INTRO
                else:
                    intro = (
                        f"Happy Services handles {_phrase(service.name)} for homes and flats across {town.name}, "
                        f"{district} district — {service.short_description[0].lower()}{service.short_description[1:]} "
                        f"Book by phone, WhatsApp or the form."
                    )
                ServiceArea.objects.get_or_create(
                    service=service,
                    town=town,
                    defaults={
                        "title": title,
                        "intro": intro,
                        "meta_title": title,
                        "meta_description": (
                            f"{service.name} in {town.name}, {district}. Book a local technician by phone, "
                            f"WhatsApp or online — quote before any work."
                        )[:170],
                        "types": AC_TYPES if service.slug == "ac-service" else [],
                        "brands": [],
                        "areas_covered": [town.name],
                        "is_published": service.slug in PUBLISHED_SERVICES,
                    },
                )

    def seed_faqs(self, services):
        def upsert(scope, rows, **scope_fk):
            for order, (question, answer, published) in enumerate(rows, start=1):
                Faq.objects.get_or_create(
                    scope=scope,
                    question=question,
                    **scope_fk,
                    defaults={"answer": answer, "sort_order": order, "is_published": published},
                )

        upsert(Faq.Scope.GLOBAL, GLOBAL_FAQS)
        upsert(Faq.Scope.SERVICE, AC_FAQS, service=services["ac-service"])
        upsert(Faq.Scope.DISTRICT, KANNUR_FAQS, district=District.objects.get(slug="kannur"))
