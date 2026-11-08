from django.urls import path

from . import views

urlpatterns = [
    path("health", views.HealthView.as_view(), name="health"),
    path("services", views.ServiceListView.as_view(), name="service-list"),
    path("services/<slug:slug>", views.ServiceDetailView.as_view(), name="service-detail"),
    path("locations", views.LocationListView.as_view(), name="location-list"),
    path("locations/<slug:district>", views.DistrictHubView.as_view(), name="district-hub"),
    path("locations/<slug:district>/<slug:town>", views.TownPageView.as_view(), name="town-page"),
    path("pages/published", views.PublishedPagesView.as_view(), name="pages-published"),
    path("pages/<slug:district>/<slug:town>/<slug:service>", views.LandingPageView.as_view(), name="landing-page"),
    path("faqs", views.FaqListView.as_view(), name="faq-list"),
    path("reviews", views.ReviewListView.as_view(), name="review-list"),
    path("site-photos", views.SitePhotosView.as_view(), name="site-photos"),
    path("legal/<slug:slug>", views.LegalPageView.as_view(), name="legal-page"),
]
