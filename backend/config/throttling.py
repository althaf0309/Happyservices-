import re

from rest_framework.throttling import ScopedRateThrottle

_PERIOD_RE = re.compile(r"(\d*)([smhd])\w*")
_UNIT_SECONDS = {"s": 1, "m": 60, "h": 3600, "d": 86400}


class WindowedScopedRateThrottle(ScopedRateThrottle):
    """ScopedRateThrottle that understands multi-unit windows such as "5/10min".

    DRF's own parser only reads the first letter of the period, so "5/10min"
    would silently become 5 per *minute*.
    """

    def parse_rate(self, rate):
        if rate is None:
            return (None, None)
        num, period = rate.split("/")
        match = _PERIOD_RE.fullmatch(period)
        if not match:
            raise ValueError(f"Invalid throttle rate: {rate!r}")
        multiplier = int(match.group(1) or 1)
        return int(num), multiplier * _UNIT_SECONDS[match.group(2)]
