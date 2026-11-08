from django.urls import path

from . import views

admin_list = views.AdminBookingViewSet.as_view({"get": "list"})
admin_detail = views.AdminBookingViewSet.as_view({"get": "retrieve", "patch": "partial_update"})

urlpatterns = [
    path("bookings", views.BookingCreateView.as_view(), name="booking-create"),
    path("events/contact-click", views.ContactClickView.as_view(), name="contact-click"),
    path("admin/bookings", admin_list, name="admin-booking-list"),
    path("admin/bookings/export.csv", views.AdminBookingExportView.as_view(), name="admin-booking-export"),
    path("admin/bookings/<uuid:pk>", admin_detail, name="admin-booking-detail"),
]
