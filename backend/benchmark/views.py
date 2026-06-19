from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import BenchmarkRequestSerializer
from .services import QueryRunner


@api_view(["GET"])
def health_check(request):
    return Response({"app": "benchmark", "status": "ok"})


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
