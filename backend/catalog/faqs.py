from .models import Faq


def resolve_faqs(*, service=None, district=None, service_area=None):
    """Return the published FAQs for the most specific scope that has any.

    Order of precedence: landing page > service > district > global.
    """
    published = Faq.objects.filter(is_published=True)
    candidates = []
    if service_area is not None:
        candidates.append(published.filter(scope=Faq.Scope.SERVICE_AREA, service_area=service_area))
    if service is not None:
        candidates.append(published.filter(scope=Faq.Scope.SERVICE, service=service))
    if district is not None:
        candidates.append(published.filter(scope=Faq.Scope.DISTRICT, district=district))
    candidates.append(published.filter(scope=Faq.Scope.GLOBAL))

    for queryset in candidates:
        faqs = list(queryset)
        if faqs:
            return faqs
    return []


def faq_tokens(*, service=None, town=None, district=None):
    return {
        "{service}": service.name if service else "this service",
        "{town}": town.name if town else "your area",
        "{district}": district.name if district else "your district",
    }
