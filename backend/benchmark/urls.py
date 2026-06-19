from django.urls import path

from .views import health_check, run_benchmark


urlpatterns = [
    path("health/", health_check, name="benchmark-health"),
    path("run/", run_benchmark, name="benchmark-run"),
]
