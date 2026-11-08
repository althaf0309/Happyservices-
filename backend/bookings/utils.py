import hashlib
import re

from django.conf import settings
from django.utils import timezone

PHONE_RE = re.compile(r"^[6-9]\d{9}$")


def normalize_phone(value: str) -> str:
    """Strip spaces/dashes and a +91, 91 or 0 prefix.

    The bare "91"/"0" prefixes are only stripped when the length shows they are a
    prefix, so a real number such as 91234 56789 is not mangled.
    """
    v = re.sub(r"[\s\-()]", "", value)
    if v.startswith("+91"):
        v = v[3:]
    elif len(v) == 12 and v.startswith("91"):
        v = v[2:]
    elif len(v) == 11 and v.startswith("0"):
        v = v[1:]
    return v


def make_reference() -> str:
    """HS-YYMMDD-NNNN, counting up within the day (e.g. HS-261031-0042)."""
    from .models import Booking

    prefix = f"HS-{timezone.localdate():%y%m%d}-"
    last = (
        Booking.objects.filter(reference__startswith=prefix)
        .order_by("-reference")
        .values_list("reference", flat=True)
        .first()
    )
    number = int(last.rsplit("-", 1)[1]) + 1 if last else 1
    return f"{prefix}{number:04d}"


def hash_ip(ip: str | None) -> str:
    if not ip:
        return ""
    return hashlib.sha256(f"{settings.IP_HASH_SALT}:{ip}".encode()).hexdigest()
