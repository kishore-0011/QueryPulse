import time

from django.db import connection

from benchmark.models import Benchmark


class QueryRunner:
    def execute(self, query: str) -> Benchmark:
        benchmark = Benchmark.objects.create(query=query, status="PENDING")

        start_time = time.perf_counter()
        try:
            with connection.cursor() as cursor:
                cursor.execute(query)
                rows = cursor.fetchall()
            end_time = time.perf_counter()
        except Exception:
            end_time = time.perf_counter()
            benchmark.execution_time_ms = (end_time - start_time) * 1000
            benchmark.status = "FAILED"
            benchmark.save(update_fields=["execution_time_ms", "status"])
            raise

        benchmark.execution_time_ms = (end_time - start_time) * 1000
        benchmark.rows_returned = len(rows)
        benchmark.status = "SUCCESS"
        benchmark.save(update_fields=["execution_time_ms", "rows_returned", "status"])
        return benchmark
