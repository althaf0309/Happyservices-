from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import CommonProblem, District, Faq, LegalPage, Review, Service, SubService, Town


def image_payload(image, alt):
    """{url, alt} with an absolute URL, or None when nothing is uploaded."""
    if not image:
        return None
    return {"url": f"{settings.PUBLIC_BASE_URL}{image.url}", "alt": alt}


class ImageSerializer(serializers.Serializer):
    url = serializers.CharField()
    alt = serializers.CharField()


class ImageFieldMixin:
    """Adds `image` from the model's image + image_alt columns."""

    @extend_schema_field(ImageSerializer(allow_null=True))
    def get_image(self, obj):
        return image_payload(obj.image, obj.image_alt or obj.name)


class ServiceSerializer(ImageFieldMixin, serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ["slug", "name", "short_description", "icon", "image", "is_popular", "is_featured", "sort_order"]


class SubServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubService
        fields = ["name", "description"]


class CommonProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonProblem
        fields = ["title", "cause"]


class TownSerializer(serializers.ModelSerializer):
    district = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)

    class Meta:
        model = Town
        fields = ["slug", "name", "blurb", "district", "district_name"]


class DistrictSerializer(ImageFieldMixin, serializers.ModelSerializer):
    # Expects districts fetched with catalog.queries.districts_with_towns()
    towns = TownSerializer(many=True, source="active_towns")
    image = serializers.SerializerMethodField()

    class Meta:
        model = District
        fields = ["slug", "name", "tagline", "summary", "image", "towns"]


class DistrictDetailSerializer(DistrictSerializer):
    class Meta(DistrictSerializer.Meta):
        fields = [*DistrictSerializer.Meta.fields, "intro"]


class FaqSerializer(serializers.ModelSerializer):
    """Fills {town}/{district}/{service} placeholders from context["faq_tokens"]."""

    class Meta:
        model = Faq
        fields = ["id", "question", "answer"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for token, value in self.context.get("faq_tokens", {}).items():
            data["question"] = data["question"].replace(token, value)
            data["answer"] = data["answer"].replace(token, value)
        return data


class ReviewSerializer(serializers.ModelSerializer):
    service = serializers.SerializerMethodField()
    town = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ["id", "name", "text", "service", "town", "source", "rating"]

    def get_service(self, obj) -> str:
        return obj.service.name if obj.service else ""

    def get_town(self, obj) -> str:
        return obj.town.name if obj.town else ""


class ServiceDetailSerializer(ServiceSerializer):
    sub_services = SubServiceSerializer(many=True)
    common_problems = CommonProblemSerializer(many=True)
    faqs = serializers.SerializerMethodField()
    towns = serializers.SerializerMethodField()

    class Meta(ServiceSerializer.Meta):
        fields = [*ServiceSerializer.Meta.fields, "description", "sub_services", "common_problems", "faqs", "towns"]

    @extend_schema_field(FaqSerializer(many=True))
    def get_faqs(self, obj):
        return FaqSerializer(self.context["faqs"], many=True, context=self.context).data

    @extend_schema_field(TownSerializer(many=True))
    def get_towns(self, obj):
        return TownSerializer(self.context["towns"], many=True).data


class PageRefSerializer(serializers.Serializer):
    town = serializers.CharField()
    service = serializers.CharField()


class DistrictHubSerializer(serializers.Serializer):
    district = DistrictDetailSerializer()
    popular_services = ServiceSerializer(many=True)
    services = ServiceSerializer(many=True)
    faqs = FaqSerializer(many=True)
    other_districts = DistrictSerializer(many=True)
    pages = PageRefSerializer(many=True, help_text="Published service × town pages in this district.")


class TownPageSerializer(serializers.Serializer):
    district = DistrictSerializer()
    town = TownSerializer()
    services = ServiceSerializer(many=True, help_text="Services with a published landing page in this town.")
    faqs = FaqSerializer(many=True)


class PublishedPageSerializer(serializers.Serializer):
    district = serializers.CharField()
    town = serializers.CharField()
    service = serializers.CharField()
    updated_at = serializers.DateTimeField()


class NearbySerializer(serializers.Serializer):
    same_service_towns = TownSerializer(many=True)
    other_services = ServiceSerializer(many=True)


class LandingPageSerializer(serializers.Serializer):
    district = DistrictSerializer()
    town = TownSerializer()
    service = ServiceSerializer()
    title = serializers.CharField()
    intro = serializers.CharField()
    meta_title = serializers.CharField()
    meta_description = serializers.CharField()
    hero_image = ImageSerializer(allow_null=True)
    sub_services = SubServiceSerializer(many=True)
    common_problems = CommonProblemSerializer(many=True)
    types = serializers.ListField(child=serializers.CharField())
    brands = serializers.ListField(child=serializers.CharField())
    areas_covered = serializers.ListField(child=serializers.CharField())
    faqs = FaqSerializer(many=True)
    nearby = NearbySerializer()


class LegalPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalPage
        fields = ["slug", "title", "body", "updated_at"]
