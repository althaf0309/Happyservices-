from django.db import connection
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import generics, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from .faqs import faq_tokens, resolve_faqs
from .models import Faq, LegalPage, Review, SitePhoto
from .queries import active_services, active_towns, districts_with_towns, published_areas
from .serializers import (
    DistrictHubSerializer,
    ImageSerializer,
    LegalPageSerializer,
    DistrictSerializer,
    FaqSerializer,
    LandingPageSerializer,
    PublishedPageSerializer,
    ReviewSerializer,
    ServiceDetailSerializer,
    ServiceSerializer,
    TownPageSerializer,
    image_payload,
)


class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    queryset = active_services()


class ServiceDetailView(APIView):
    @extend_schema(responses=ServiceDetailSerializer)
    def get(self, request, slug):
        service = get_object_or_404(
            active_services().prefetch_related("sub_services", "common_problems"), slug=slug
        )
        towns = active_towns().filter(service_areas__in=published_areas().filter(service=service))
        context = {
            "faqs": resolve_faqs(service=service),
            "faq_tokens": faq_tokens(service=service),
            "towns": towns,
        }
        return Response(ServiceDetailSerializer(service, context=context).data)


class LocationListView(generics.ListAPIView):
    serializer_class = DistrictSerializer
    queryset = districts_with_towns()


class DistrictHubView(APIView):
    @extend_schema(operation_id="district_hub", responses=DistrictHubSerializer)
    def get(self, request, district):
        districts = list(districts_with_towns())
        current = next((d for d in districts if d.slug == district), None)
        if current is None:
            return Response({"detail": "Not found."}, status=404)
        services = list(active_services())
        pages = published_areas().filter(town__district=current).values_list("town__slug", "service__slug")
        data = {
            "district": current,
            "popular_services": [s for s in services if s.is_popular],
            "services": services,
            "faqs": resolve_faqs(district=current),
            "other_districts": [d for d in districts if d.pk != current.pk],
            "pages": [{"town": town, "service": service} for town, service in pages],
        }
        context = {"faq_tokens": faq_tokens(district=current)}
        return Response(DistrictHubSerializer(data, context=context).data)


class TownPageView(APIView):
    @extend_schema(operation_id="town_page", responses=TownPageSerializer)
    def get(self, request, district, town):
        district_obj = get_object_or_404(districts_with_towns(), slug=district)
        town_obj = next((t for t in district_obj.active_towns if t.slug == town), None)
        if town_obj is None:
            return Response({"detail": "Not found."}, status=404)
        services = active_services().filter(service_areas__in=published_areas().filter(town=town_obj))
        data = {
            "district": district_obj,
            "town": town_obj,
            "services": services,
            "faqs": resolve_faqs(district=district_obj),
        }
        context = {"faq_tokens": faq_tokens(town=town_obj, district=district_obj)}
        return Response(TownPageSerializer(data, context=context).data)


class PublishedPagesView(APIView):
    @extend_schema(responses=PublishedPageSerializer(many=True))
    def get(self, request):
        rows = published_areas().values("town__district__slug", "town__slug", "service__slug", "updated_at")
        data = [
            {
                "district": r["town__district__slug"],
                "town": r["town__slug"],
                "service": r["service__slug"],
                "updated_at": r["updated_at"],
            }
            for r in rows
        ]
        return Response(PublishedPageSerializer(data, many=True).data)


class LandingPageView(APIView):
    @extend_schema(responses=LandingPageSerializer)
    def get(self, request, district, town, service):
        area = get_object_or_404(
            published_areas().select_related("service", "town__district"),
            town__district__slug=district,
            town__slug=town,
            service__slug=service,
        )
        district_obj = districts_with_towns().get(pk=area.town.district_id)
        same_service_towns = (
            active_towns()
            .filter(district=district_obj, service_areas__in=published_areas().filter(service=area.service))
            .exclude(pk=area.town_id)
        )
        other_services = active_services().filter(
            service_areas__in=published_areas().filter(town=area.town)
        ).exclude(pk=area.service_id)
        data = {
            "district": district_obj,
            "town": area.town,
            "service": area.service,
            "title": area.title,
            "intro": area.intro,
            "meta_title": area.meta_title or area.title,
            "meta_description": area.meta_description,
            "hero_image": image_payload(area.hero_image, area.hero_image_alt or area.title),
            "sub_services": area.service.sub_services.all(),
            "common_problems": area.service.common_problems.all(),
            "types": area.types,
            "brands": area.brands,
            "areas_covered": area.areas_covered,
            "faqs": resolve_faqs(service_area=area, service=area.service, district=district_obj),
            "nearby": {"same_service_towns": same_service_towns, "other_services": other_services},
        }
        context = {"faq_tokens": faq_tokens(service=area.service, town=area.town, district=district_obj)}
        return Response(LandingPageSerializer(data, context=context).data)


class FaqListView(generics.ListAPIView):
    serializer_class = FaqSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("scope", OpenApiTypes.STR, enum=[c.value for c in Faq.Scope], default="global"),
            OpenApiParameter("service", OpenApiTypes.STR, description="Service slug"),
            OpenApiParameter("district", OpenApiTypes.STR, description="District slug"),
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params
        qs = Faq.objects.filter(is_published=True, scope=params.get("scope", Faq.Scope.GLOBAL))
        if service := params.get("service"):
            qs = qs.filter(service__slug=service)
        if district := params.get("district"):
            qs = qs.filter(district__slug=district)
        return qs


class ReviewListView(generics.ListAPIView):
    """Published reviews only. May be empty — the frontend hides the section then."""

    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.filter(is_published=True).select_related("service", "town")
        if service := self.request.query_params.get("service"):
            qs = qs.filter(service__slug=service)
        if town := self.request.query_params.get("town"):
            qs = qs.filter(town__slug=town)
        return qs


class SitePhotosView(APIView):
    """Uploaded photos for fixed slots, keyed by slot (missing slots = placeholder)."""

    @extend_schema(
        responses=inline_serializer(
            "SitePhotos", {slot.value: ImageSerializer(required=False) for slot in SitePhoto.Slot}
        )
    )
    def get(self, request):
        return Response({p.slot: image_payload(p.image, p.alt) for p in SitePhoto.objects.all()})


class LegalPageView(generics.RetrieveAPIView):
    """404 until the client's text is published; the site shows its draft meanwhile."""

    serializer_class = LegalPageSerializer
    queryset = LegalPage.objects.filter(is_published=True)
    lookup_field = "slug"


class HealthView(APIView):
    @extend_schema(responses=inline_serializer("Health", {"status": serializers.CharField()}))
    def get(self, request):
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response({"status": "ok"})
