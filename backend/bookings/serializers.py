from rest_framework import serializers

from catalog.models import Service, Town

from .models import Booking, ContactClick
from .utils import PHONE_RE, normalize_phone

PHONE_ERROR = "Please enter a valid 10-digit mobile number."


class BookingCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        min_length=2, max_length=80, error_messages={"blank": "Please enter your name", "min_length": "Please enter your name"}
    )
    phone = serializers.CharField(max_length=20, error_messages={"blank": PHONE_ERROR})
    service = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Service.objects.filter(is_active=True),
        error_messages={"does_not_exist": "Choose a service", "null": "Choose a service", "required": "Choose a service"},
    )
    town = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Town.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        error_messages={"does_not_exist": "Choose your location"},
    )
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)  # honeypot

    class Meta:
        model = Booking
        fields = [
            "id", "reference", "status", "name", "phone", "service", "town", "other_location",
            "problem", "preferred_time", "source", "page_url", "utm", "website",
        ]
        read_only_fields = ["id", "reference", "status"]
        extra_kwargs = {"problem": {"max_length": 1000}}

    def validate_phone(self, value):
        value = normalize_phone(value)
        if not PHONE_RE.match(value):
            raise serializers.ValidationError(PHONE_ERROR)
        return value

    def validate_utm(self, value):
        if not isinstance(value, dict) or not all(isinstance(v, str) for v in value.values()):
            raise serializers.ValidationError("Expected an object of strings.")
        return {str(k)[:40]: v[:200] for k, v in list(value.items())[:10]}

    def validate(self, data):
        if not data.get("town") and not data.get("other_location", "").strip():
            raise serializers.ValidationError({"town": "Choose your location"})
        return data


class BookingCreatedSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    reference = serializers.CharField()
    status = serializers.CharField()


class BookingAdminSerializer(serializers.ModelSerializer):
    service = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    town = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "reference", "name", "phone", "service", "town", "other_location", "problem",
            "preferred_time", "status", "source", "page_url", "utm", "notes", "created_at", "updated_at",
        ]
        read_only_fields = [f for f in fields if f not in ("status", "notes")]


class ContactClickSerializer(serializers.ModelSerializer):
    service = serializers.SlugRelatedField(
        slug_field="slug", queryset=Service.objects.all(), required=False, allow_null=True
    )
    town = serializers.SlugRelatedField(slug_field="slug", queryset=Town.objects.all(), required=False, allow_null=True)

    class Meta:
        model = ContactClick
        fields = ["kind", "service", "town", "placement", "page_url"]
