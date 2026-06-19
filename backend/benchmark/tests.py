from unittest.mock import patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from benchmark.models import Benchmark
from benchmark.views import run_benchmark


class RunBenchmarkViewTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_rejects_non_select_queries(self):
        request = self.factory.post(
            "/api/benchmark/run/",
            {"query": "DELETE FROM benchmark_benchmark;"},
            format="json",
        )

        response = run_benchmark(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Only SELECT queries are allowed.")

    @patch("benchmark.views.QueryRunner.execute")
    def test_returns_benchmark_result_for_select_queries(self, execute_mock):
        execute_mock.return_value = Benchmark(
            id=1,
            query="SELECT NOW();",
            execution_time_ms=3.2,
            rows_returned=1,
            status="SUCCESS",
        )
        request = self.factory.post(
            "/api/benchmark/run/",
            {"query": "SELECT NOW();"},
            format="json",
        )

        response = run_benchmark(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "benchmark_id": 1,
                "execution_time_ms": 3.2,
                "rows_returned": 1,
                "status": "SUCCESS",
            },
        )
