from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.db.models import Count, Min, Max

from .models import Benchmark, BenchmarkSession, Recommendation
from .serializers import BenchmarkRequestSerializer
from .services import ExplainAnalyzer, PlanAnalyzer, PlanTreeBuilder, QueryRunner


@api_view(["GET"])
def health_check(request):
    return Response({"app": "benchmark", "status": "ok"})


@api_view(["GET"])
def benchmark_history(request):
    benchmarks = Benchmark.objects.order_by("-created_at")[:20]

    return Response(
        [
            {
                "benchmark_id": benchmark.id,
                "query": benchmark.query,
                "execution_time_ms": round(benchmark.execution_time_ms or 0, 2),
                "created_at": benchmark.created_at,
            }
            for benchmark in benchmarks
        ],
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def benchmark_detail(request, benchmark_id):
    benchmark = get_object_or_404(
        Benchmark.objects.select_related("query_plan").prefetch_related(
            "query_plan__recommendations"
        ),
        pk=benchmark_id,
    )

    recommendations = []
    node_type = None
    query_plan = getattr(benchmark, "query_plan", None)
    if query_plan is not None:
        recommendations = [
            _serialize_recommendation(recommendation)
            for recommendation in query_plan.recommendations.all()
        ]
        plan = getattr(query_plan, "plan", None)
        if plan:
            node_type = PlanAnalyzer().get_root_node_type(plan)

    return Response(
        {
            "benchmark_id": benchmark.id,
            "query": benchmark.query,
            "execution_time_ms": round(benchmark.execution_time_ms or 0, 2),
            "rows_returned": benchmark.rows_returned or 0,
            "node_type": node_type,
            "cost_metrics": _serialize_cost_metrics(query_plan),
            "recommendations": recommendations,
        },
        status=status.HTTP_200_OK,
    )


def _serialize_recommendation(recommendation):
    data = {
        "type": recommendation.rule_type,
        "severity": recommendation.severity,
        "message": recommendation.message,
    }
    if recommendation.before_execution_time is not None:
        data["before_execution_time"] = recommendation.before_execution_time
    if recommendation.after_execution_time is not None:
        data["after_execution_time"] = recommendation.after_execution_time
    if recommendation.improvement_percent is not None:
        data["improvement_percent"] = recommendation.improvement_percent
    return data


def _serialize_cost_metrics(query_plan):
    if query_plan is None:
        return None
    data = {}
    if query_plan.startup_cost is not None:
        data["startup_cost"] = query_plan.startup_cost
    if query_plan.total_cost is not None:
        data["total_cost"] = query_plan.total_cost
    if query_plan.plan_rows is not None:
        data["plan_rows"] = query_plan.plan_rows
    if query_plan.actual_rows is not None:
        data["actual_rows"] = query_plan.actual_rows
    return data or None


def _serialize_benchmark_comparison(benchmark):
    query_plan = getattr(benchmark, "query_plan", None)
    plan = getattr(query_plan, "plan", None) if query_plan is not None else None
    node_types = PlanAnalyzer().get_all_node_types(plan) if plan is not None else []

    recommendations = []
    if query_plan is not None:
        recommendations = [
            _serialize_recommendation(recommendation)
            for recommendation in query_plan.recommendations.all()
        ]

    planning_time = None
    if query_plan is not None:
        planning_time = query_plan.planning_time

    return {
        "benchmark_id": benchmark.id,
        "query": benchmark.query,
        "execution_time_ms": round(benchmark.execution_time_ms or 0, 2),
        "rows_returned": benchmark.rows_returned or 0,
        "planning_time": round(planning_time or 0, 2) if planning_time is not None else None,
        "node_types": node_types,
        "cost_metrics": _serialize_cost_metrics(query_plan),
        "recommendations": recommendations,
    }


@api_view(["GET"])
def benchmark_compare(request):
    first_id = request.query_params.get("first")
    second_id = request.query_params.get("second")

    if not first_id or not second_id:
        return Response(
            {"detail": "Both 'first' and 'second' query parameters are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    first = get_object_or_404(
        Benchmark.objects.select_related("query_plan").prefetch_related(
            "query_plan__recommendations"
        ),
        pk=first_id,
    )
    second = get_object_or_404(
        Benchmark.objects.select_related("query_plan").prefetch_related(
            "query_plan__recommendations"
        ),
        pk=second_id,
    )

    first_execution_time = first.execution_time_ms or 0
    second_execution_time = second.execution_time_ms or 0
    if first_execution_time:
        improvement_percent = round(
            ((first_execution_time - second_execution_time) / first_execution_time) * 100,
            2,
        )
    else:
        improvement_percent = None

    return Response(
        {
            "first": _serialize_benchmark_comparison(first),
            "second": _serialize_benchmark_comparison(second),
            "improvement_percent": improvement_percent,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def explain_benchmark(request):
    serializer = BenchmarkRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    query = serializer.validated_data["query"]
    if not query.strip().upper().startswith("SELECT"):
        return Response(
            {"detail": "Only SELECT queries are allowed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    analyzer = ExplainAnalyzer()
    try:
        query_plan = analyzer.run(query)
    except Exception as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if query_plan is None:
        return Response(
            {"detail": "Failed to analyze query plan."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "benchmark_id": query_plan.benchmark.id,
            "status": query_plan.benchmark.status,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def benchmark_plan(request, benchmark_id):
    benchmark = get_object_or_404(
        Benchmark.objects.select_related("query_plan"), pk=benchmark_id
    )
    query_plan = getattr(benchmark, "query_plan", None)
    plan = getattr(query_plan, "plan", None) if query_plan is not None else None

    tree = PlanTreeBuilder().build(plan)
    if tree is None:
        return Response(
            {"detail": "No query plan available for this benchmark."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(tree, status=status.HTTP_200_OK)


@api_view(["GET"])
def session_list(request):
    sessions = BenchmarkSession.objects.order_by("-created_at")
    return Response(
        [
            {
                "id": session.id,
                "name": session.name,
                "created_at": session.created_at,
                "benchmark_count": session.benchmarks.count(),
            }
            for session in sessions
        ],
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def session_detail(request, session_id):
    session = get_object_or_404(
        BenchmarkSession.objects.prefetch_related("benchmarks__query_plan"),
        pk=session_id,
    )
    benchmarks = session.benchmarks.order_by("created_at")

    return Response(
        {
            "id": session.id,
            "name": session.name,
            "created_at": session.created_at,
            "benchmarks": [
                _serialize_benchmark_comparison(b) for b in benchmarks
            ],
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
def session_summary(request, session_id):
    session = get_object_or_404(
        BenchmarkSession.objects.prefetch_related(
            "benchmarks__query_plan__recommendations"
        ),
        pk=session_id,
    )
    benchmarks = list(session.benchmarks.order_by("created_at"))

    benchmark_count = len(benchmarks)
    before_execution_time = benchmarks[0].execution_time_ms if benchmarks else None
    after_execution_time = benchmarks[-1].execution_time_ms if benchmarks else None

    if before_execution_time and after_execution_time is not None:
        improvement_percent = round(
            ((before_execution_time - after_execution_time) / before_execution_time)
            * 100,
            2,
        )
    else:
        improvement_percent = None

    recommendation_count = sum(
        query_plan.recommendations.count()
        for b in benchmarks
        if (query_plan := getattr(b, "query_plan", None)) is not None
    )

    return Response(
        {
            "session_id": session.id,
            "session_name": session.name,
            "benchmark_count": benchmark_count,
            "before_execution_time_ms": (
                round(before_execution_time, 2) if before_execution_time is not None else None
            ),
            "after_execution_time_ms": (
                round(after_execution_time, 2) if after_execution_time is not None else None
            ),
            "improvement_percent": improvement_percent,
            "recommendation_count": recommendation_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def run_benchmark(request):
    serializer = BenchmarkRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    query = serializer.validated_data["query"]
    if not query.strip().upper().startswith("SELECT"):
        return Response(
            {"detail": "Only SELECT queries are allowed."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    runner = QueryRunner()
    try:
        benchmark = runner.execute(query)
    except Exception as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "benchmark_id": benchmark.id,
            "execution_time_ms": round(benchmark.execution_time_ms or 0, 2),
            "rows_returned": benchmark.rows_returned or 0,
            "status": benchmark.status,
        },
        status=status.HTTP_200_OK,
    )
