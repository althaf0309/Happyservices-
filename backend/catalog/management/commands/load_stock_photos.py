"""Fill empty photo slots with free stock photos (Unsplash License) until the client's own arrive.

Only empty slots are filled, so photos uploaded in the admin are never replaced.
Use --replace-stock to refresh slots that still hold a photo from this command.
Credits: docs/PHOTO-CREDITS.md.
"""

import urllib.request

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from catalog.models import District, Service, SitePhoto
from catalog.signals import revalidation_muted

UNSPLASH = "https://images.unsplash.com/photo-{id}?w=2000&q=80&fm=jpg&fit=max"
STOCK_PREFIX = "stock-"  # uploaded filenames start with this so we can tell stock from client photos

SITE_PHOTOS = {
    SitePhoto.Slot.HOME_HERO: ("1792799888905-8696bd32a11a", "Technician servicing an air conditioner unit"),
    # Deliberately no person: the design asks for the client's real technician here.
    SitePhoto.Slot.HOME_WHY_US: ("1581783898377-1c85bf937427", "Hammer, pliers, screwdriver and nails laid out on a white surface"),
}

SERVICE_PHOTOS = {
    # No visible brand logos (handoff: no third-party logos).
    "ac-service": ("1718203862467-c33159fdc504", "Air conditioner outdoor unit mounted on a brick wall"),
    "refrigerator-repair": ("1721613877687-c9099b698faa", "Side-by-side refrigerator in a home"),
    "washing-machine-repair": ("1626806787461-102c1bfaaea1", "Front-load washing machine in a laundry corner"),
    "plumbing": ("1676210134188-4c05dd172f89", "Plumber fixing the pipes under a sink"),
    "electrical": ("1621905251189-08b45d6a269e", "Electrician in a hard hat testing a switchboard"),
    "cctv-installation": ("1549109926-58f039549485", "Security camera mounted on a wall"),
    "tv-service": ("1593784991251-92ded75ea290", "Flat-screen TV in a living room"),
    "painting": ("1688372199140-cade7ae820fe", "Painter rolling yellow paint onto a wall"),
    "interior-services": ("1616047006789-b7af5afb8c20", "Furnished living room with a tan sofa"),
    "welding-fabrication": ("1455165814004-1126a7199f9b", "Welder in a protective helmet working on metal"),
    "gas-pipeline": ("1728509741559-44172bcd86b3", "Blue flame on a gas stove burner"),
}

DISTRICT_PHOTOS = {
    "kannur": ("1606619071892-b37a5d615297", "Thottada beach, Kannur"),
    "thrissur": ("1726995036039-1ff318dd445c", "Kerala temple architecture at the Vadakkumnathan temple grounds, Thrissur"),
    "kochi": ("1645680149311-5a00ae5a2b2a", "Chinese fishing nets at sunset in Pizhala, Kochi"),
}


def download(photo_id):
    request = urllib.request.Request(UNSPLASH.format(id=photo_id), headers={"User-Agent": "happy-services-seed"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


class Command(BaseCommand):
    help = "Fill empty photo slots with free stock photos (never replaces client uploads)."

    def add_arguments(self, parser):
        parser.add_argument("--replace-stock", action="store_true", help="Also refresh slots that hold an earlier stock photo.")

    def handle(self, *args, replace_stock=False, **options):
        self.replace_stock = replace_stock
        self.filled = 0
        with revalidation_muted():
            for slot, (photo_id, alt) in SITE_PHOTOS.items():
                photo = SitePhoto.objects.filter(slot=slot).first() or SitePhoto(slot=slot)
                self.fill(photo, "image", "alt", photo_id, alt, f"site-{slot}")
            for slug, (photo_id, alt) in SERVICE_PHOTOS.items():
                if service := Service.objects.filter(slug=slug).first():
                    self.fill(service, "image", "image_alt", photo_id, alt, f"service-{slug}")
            for slug, (photo_id, alt) in DISTRICT_PHOTOS.items():
                if district := District.objects.filter(slug=slug).first():
                    self.fill(district, "image", "image_alt", photo_id, alt, f"district-{slug}")
        # One revalidation for the whole batch.
        from catalog.tasks import revalidate_frontend

        revalidate_frontend.delay()
        self.stdout.write(self.style.SUCCESS(f"Filled {self.filled} photo slot(s)."))

    def fill(self, obj, image_field, alt_field, photo_id, alt, name):
        current = getattr(obj, image_field)
        is_stock = bool(current) and current.name.rsplit("/", 1)[-1].startswith(STOCK_PREFIX)
        if current and not (self.replace_stock and is_stock):
            self.stdout.write(f"  skip {name} (already has a photo)")
            return
        if current:
            current.delete(save=False)
        setattr(obj, alt_field, alt)
        # Photo id in the name: a different photo always gets a new URL (no stale image caches).
        getattr(obj, image_field).save(f"{STOCK_PREFIX}{name}-{photo_id[:13]}.jpg", ContentFile(download(photo_id)), save=False)
        obj.save()
        self.filled += 1
        self.stdout.write(f"  set  {name}")
