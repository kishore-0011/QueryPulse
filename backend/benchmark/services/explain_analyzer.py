from django.db import connection, transaction

from benchmark.models import Benchmark, QueryPlan, Recommendation
from benchmark.services.plan_analyzer import PlanAnalyzer


class ExplainAnalyzer:
    def run(self, query: str):
        explain_query = f"EXPLAIN (ANALYZE, FORMAT JSON) {query}"

        with transaction.atomic():
            benchmark = Benchmark.objects.create(query=query, status="PENDING")

            try:
                with connection.cursor() as cursor:
                    cursor.execute(explain_query)
                    result = cursor.fetchone()
            except Exception:
                benchmark.status = "FAILED"
                benchmark.save(update_fields=["status"])
                raise

            if result is None:
                benchmark.status = "FAILED"
                benchmark.save(update_fields=["status"])
                return None

            plan = result[0]
            plan_summary = plan[0]

            query_plan = QueryPlan.objects.create(
                benchmark=benchmark,
                plan=plan,
                planning_time=plan_summary["Planning Time"],
                execution_time=plan_summary["Execution Time"],
            )
            findings = PlanAnalyzer().analyze(query_plan.plan, query)
            Recommendation.objects.bulk_create(
                [
                    Recommendation(
                        query_plan=query_plan,
                        rule_type=finding["type"],
                        severity=finding["severity"],
                        message=finding["message"],
                    )
                    for finding in findings
                ]
            )

            benchmark.execution_time_ms = query_plan.execution_time
            benchmark.status = "SUCCESS"
            benchmark.save(update_fields=["execution_time_ms", "status"])

        return query_plan
