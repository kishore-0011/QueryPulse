from django.urls import path

from .views import (
    apply_template,
    benchmark_compare,
    benchmark_detail,
    benchmark_history,
    benchmark_plan,
    create_table,
    environment,
    explain_benchmark,
    generate_table_data,
    health_check,
    recommendation_list,
    run_benchmark,
    session_detail,
    session_list,
    session_summary,
)


urlpatterns = [
    path("compare/", benchmark_compare, name="benchmark-compare"),
    path("", benchmark_history, name="benchmark-history"),
    path("<int:benchmark_id>/", benchmark_detail, name="benchmark-detail"),
    path("<int:benchmark_id>/plan/", benchmark_plan, name="benchmark-plan"),
    path("explain/", explain_benchmark, name="benchmark-explain"),
    path("health/", health_check, name="benchmark-health"),
    path("run/", run_benchmark, name="benchmark-run"),
    path("recommendations/", recommendation_list, name="recommendation-list"),
    path("sessions/", session_list, name="session-list"),
    path("sessions/<int:session_id>/", session_detail, name="session-detail"),
    path(
        "sessions/<int:session_id>/summary/",
        session_summary,
        name="session-summary",
    ),
    path("environment/", environment, name="environment"),
    path("environment/tables/", create_table, name="create-table"),
    path("environment/tables/<str:table_name>/generate/", generate_table_data, name="generate-table-data"),
    path("environment/templates/", apply_template, name="apply-template"),
]
