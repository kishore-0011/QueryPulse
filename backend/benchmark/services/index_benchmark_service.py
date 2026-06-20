from django.db import connection

from benchmark.models import Recommendation
from benchmark.services import ExplainAnalyzer


class IndexBenchmarkService:
    def compare(self, query: str, index_sql: str) -> dict:
        analyzer = ExplainAnalyzer()

        before_plan = analyzer.run(query)
        if before_plan is None:
            raise RuntimeError("Failed to analyze query before index creation")
        before_id = before_plan.benchmark.id
        before_time = before_plan.execution_time

        with connection.cursor() as cursor:
            cursor.execute(index_sql)

        after_plan = analyzer.run(query)
        if after_plan is None:
            raise RuntimeError("Failed to analyze query after index creation")
        after_id = after_plan.benchmark.id
        after_time = after_plan.execution_time

        improvement = round(
            ((before_time - after_time) / before_time) * 100, 1
        ) if before_time else None

        Recommendation.objects.create(
            query_plan=after_plan,
            rule_type="MISSING_INDEX",
            severity="HIGH",
            message=(
                f"Creating an index reduced execution time "
                f"from {before_time:.2f}ms to {after_time:.2f}ms"
            ),
            before_execution_time=round(before_time, 2),
            after_execution_time=round(after_time, 2),
            improvement_percent=improvement,
        )

        return {
            "before_benchmark_id": before_id,
            "after_benchmark_id": after_id,
        }
