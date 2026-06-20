from django.urls import path

from .views import (
    benchmark_detail,
    benchmark_compare,
    benchmark_history,
    explain_benchmark,
    health_check,
    run_benchmark,
)


urlpatterns = [
    path("compare/", benchmark_compare, name="benchmark-compare"),
    path("", benchmark_history, name="benchmark-history"),
    path("<int:benchmark_id>/", benchmark_detail, name="benchmark-detail"),
    path("explain/", explain_benchmark, name="benchmark-explain"),
    path("health/", health_check, name="benchmark-health"),
    path("run/", run_benchmark, name="benchmark-run"),
]
