import csv
import uuid

import django_filters
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, mixins, status, viewsets
from rest_framework.pagination import PageNumberPagination
from djangorestframework_camel_case.render import CamelCaseJSONRenderer
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.renderers import BaseRenderer
from rest_framework.response import Response
from rest_framework.throttling import BaseThrottle
from rest_framework.views import APIView

from config.throttling import WindowedScopedRateThrottle

from .models import Booking
from .serializers import (
    BookingAdminSerializer,
    BookingCreatedSerializer,
    BookingCreateSerializer,
    ContactClickSerializer,
)
from .tasks import notify_new_booking
from .utils import hash_ip, make_reference


class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [WindowedScopedRateThrottle]
    throttle_scope = "bookings"

    @extend_schema(responses={201: BookingCreatedSerializer, 400: OpenApiResponse(description="Validation errors")})
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        is_spam = bool(request.data.get("website"))
        if not serializer.is_valid():
            if is_spam:  # bots learn nothing: pretend it worked
                return self._created(uuid.uuid4(), make_reference())
            serializer.is_valid(raise_exception=True)

        serializer.validated_data.pop("website", None)
        booking = self._save(serializer, request, is_spam)
        if not is_spam:
            transaction.on_commit(lambda: notify_new_booking.delay(str(booking.pk)))
        return self._created(booking.pk, booking.reference)

    def _save(self, serializer, request, is_spam):
        extra = {
            "status": Booking.Status.SPAM if is_spam else Booking.Status.NEW,
            "ip_hash": hash_ip(BaseThrottle().get_ident(request)),
            "user_agent": request.META.get("HTTP_USER_AGENT", "")[:300],
        }
        for attempt in range(5):  # references count up per day; retry on a concurrent clash
            try:
                with transaction.atomic():
                    return serializer.save(reference=make_reference(), **extra)
            except IntegrityError:
                if attempt == 4:
                    raise
        raise AssertionError("unreachable")

    @staticmethod
    def _created(booking_id, reference):
        data = {"id": booking_id, "reference": reference, "status": Booking.Status.NEW}
        return Response(BookingCreatedSerializer(data).data, status=status.HTTP_201_CREATED)


class ContactClickView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [WindowedScopedRateThrottle]
    throttle_scope = "events"

    @extend_schema(request=ContactClickSerializer, responses={204: None})
    def post(self, request):
        serializer = ContactClickSerializer(data=request.data)
        if serializer.is_valid():  # analytics only: never fail the client
            serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookingFilter(django_filters.FilterSet):
    service = django_filters.CharFilter(field_name="service__slug")
    town = django_filters.CharFilter(field_name="town__slug")
    district = django_filters.CharFilter(field_name="town__district__slug")
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Booking
        fields = ["status", "service", "town", "district", "date_from", "date_to"]


class AdminPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "pageSize"
    max_page_size = 200


class AdminBookingViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """Staff only. Session auth (log in at /admin/ first)."""

    queryset = Booking.objects.select_related("service", "town")
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAdminUser]
    filterset_class = BookingFilter
    pagination_class = AdminPagination
    http_method_names = ["get", "patch", "head", "options"]


CSV_COLUMNS = [
    ("reference", "Reference"),
    ("created", "Received"),
    ("status", "Status"),
    ("name", "Name"),
    ("phone", "Phone"),
    ("service", "Service"),
    ("location", "Location"),
    ("preferred_time", "Preferred time"),
    ("problem", "Problem"),
    ("source", "Source"),
    ("page_url", "Page"),
    ("notes", "Notes"),
]


def _csv_safe(value):
    """Stop spreadsheet apps from evaluating customer-entered text as formulas."""
    value = str(value)
    return f"'{value}" if value[:1] in ("=", "+", "-", "@", "\t", "\r") else value


def bookings_csv_response(queryset):
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    filename = f"bookings-{timezone.localdate():%Y%m%d}.csv"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response.write("﻿")  # BOM so Excel opens UTF-8 correctly
    writer = csv.writer(response)
    writer.writerow([label for _, label in CSV_COLUMNS])
    for b in queryset.select_related("service", "town"):
        row = {
            "reference": b.reference,
            "created": timezone.localtime(b.created_at).strftime("%Y-%m-%d %H:%M"),
            "status": b.status,
            "name": b.name,
            "phone": b.phone,
            "service": b.service.name,
            "location": b.location_label,
            "preferred_time": b.get_preferred_time_display(),
            "problem": b.problem,
            "source": b.source,
            "page_url": b.page_url,
            "notes": b.notes,
        }
        writer.writerow([_csv_safe(row[key]) for key, _ in CSV_COLUMNS])
    return response


class CSVRenderer(BaseRenderer):
    """Lets clients send Accept: text/csv; the view writes the CSV itself."""

    media_type = "text/csv"
    format = "csv"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data if isinstance(data, (bytes, str)) else str(data)


class AdminBookingExportView(generics.GenericAPIView):
    queryset = Booking.objects.all()
    permission_classes = [IsAdminUser]
    renderer_classes = [CamelCaseJSONRenderer, CSVRenderer]
    filterset_class = BookingFilter

    @extend_schema(responses={(200, "text/csv"): OpenApiResponse(description="CSV export")})
    def get(self, request):
        return bookings_csv_response(self.filter_queryset(self.get_queryset()))
