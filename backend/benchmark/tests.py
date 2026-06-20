from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIRequestFactory

from benchmark.models import Benchmark, QueryPlan, Recommendation
from benchmark.services import ExplainAnalyzer, PlanAnalyzer
from benchmark.views import (
    benchmark_compare,
    benchmark_detail,
    benchmark_history,
    explain_benchmark,
    run_benchmark,
)


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

    @patch("benchmark.views.get_object_or_404")
    def test_returns_benchmark_detail_with_recommendations(self, get_object_or_404_mock):
        recommendation_list = [
            SimpleNamespace(
                rule_type="SEQ_SCAN",
                severity="HIGH",
                message="Sequential scan detected",
            )
        ]
        benchmark = SimpleNamespace(
            id=1,
            query="SELECT generate_series(1,1000);",
            execution_time_ms=1.83,
            rows_returned=1000,
            query_plan=SimpleNamespace(
                recommendations=SimpleNamespace(all=lambda: recommendation_list)
            ),
        )
        get_object_or_404_mock.return_value = benchmark
        request = self.factory.get("/api/benchmark/1/")

        response = benchmark_detail(request, benchmark_id=1)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "benchmark_id": 1,
                "query": "SELECT generate_series(1,1000);",
                "execution_time_ms": 1.83,
                "rows_returned": 1000,
                "recommendations": [
                    {
                        "type": "SEQ_SCAN",
                        "severity": "HIGH",
                        "message": "Sequential scan detected",
                    }
                ],
            },
        )

    @patch("benchmark.views.get_object_or_404")
    def test_returns_benchmark_compare_payload(self, get_object_or_404_mock):
        first_plan = SimpleNamespace(
            plan=[{"Plan": {"Node Type": "Seq Scan"}}],
            planning_time=0.5,
            recommendations=SimpleNamespace(
                all=lambda: [
                    SimpleNamespace(
                        rule_type="SEQ_SCAN",
                        severity="HIGH",
                        message="Sequential scan detected",
                    )
                ]
            ),
        )
        second_plan = SimpleNamespace(
            plan=[{"Plan": {"Node Type": "Index Scan"}}],
            planning_time=0.2,
            recommendations=SimpleNamespace(all=lambda: []),
        )
        first_benchmark = SimpleNamespace(
            id=1,
            query="SELECT * FROM users WHERE email='a@test.com';",
            execution_time_ms=120,
            rows_returned=1,
            query_plan=first_plan,
        )
        second_benchmark = SimpleNamespace(
            id=2,
            query="SELECT * FROM users WHERE email='b@test.com';",
            execution_time_ms=35,
            rows_returned=1,
            query_plan=second_plan,
        )
        get_object_or_404_mock.side_effect = [first_benchmark, second_benchmark]
        request = self.factory.get("/api/benchmark/compare/?first=1&second=2")

        response = benchmark_compare(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "first": {
                    "benchmark_id": 1,
                    "query": "SELECT * FROM users WHERE email='a@test.com';",
                    "execution_time_ms": 120,
                    "rows_returned": 1,
                    "planning_time": 0.5,
                    "node_types": ["Seq Scan"],
                    "recommendations": [
                        {
                            "type": "SEQ_SCAN",
                            "severity": "HIGH",
                            "message": "Sequential scan detected",
                        }
                    ],
                },
                "second": {
                    "benchmark_id": 2,
                    "query": "SELECT * FROM users WHERE email='b@test.com';",
                    "execution_time_ms": 35,
                    "rows_returned": 1,
                    "planning_time": 0.2,
                    "node_types": ["Index Scan"],
                    "recommendations": [],
                },
                "improvement_percent": 70.83,
            },
        )

    def test_returns_bad_request_when_compare_parameters_are_missing(self):
        request = self.factory.get("/api/benchmark/compare/")

        response = benchmark_compare(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data["detail"],
            "Both 'first' and 'second' query parameters are required.",
        )

    def test_returns_benchmark_history_newest_first_limited_to_20(self):
        benchmarks = [
            SimpleNamespace(
                id=index,
                query=f"SELECT {index};",
                execution_time_ms=index + 0.25,
                created_at=f"2026-06-19T00:00:{index:02d}Z",
            )
            for index in range(21, 0, -1)
        ]
        request = self.factory.get("/api/benchmark/")

        with patch(
            "benchmark.views.Benchmark.objects.order_by", return_value=benchmarks
        ) as order_by_mock:
            response = benchmark_history(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["benchmark_id"], 21)
        self.assertEqual(response.data[-1]["benchmark_id"], 2)
        self.assertEqual(len(response.data), 20)
        order_by_mock.assert_called_once_with("-created_at")

    def test_rejects_non_select_queries_for_explain(self):
        request = self.factory.post(
            "/api/benchmark/explain/",
            {"query": "DELETE FROM benchmark_benchmark;"},
            format="json",
        )

        response = explain_benchmark(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Only SELECT queries are allowed.")

    @patch("benchmark.views.ExplainAnalyzer.run")
    def test_returns_benchmark_id_for_explain_pipeline(self, run_mock):
        run_mock.return_value = SimpleNamespace(
            benchmark=SimpleNamespace(id=3, status="SUCCESS")
        )
        request = self.factory.post(
            "/api/benchmark/explain/",
            {"query": "SELECT generate_series(1,1000);"},
            format="json",
        )

        response = explain_benchmark(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "benchmark_id": 3,
                "status": "SUCCESS",
            },
        )


class ExplainAnalyzerTests(TestCase):
    @patch("benchmark.services.explain_analyzer.connection.cursor")
    def test_persists_query_plan_from_raw_postgres_json(self, cursor_mock):
        postgres_plan = [
            {
                "Plan": {
                    "Node Type": "Nested Loop",
                    "Plans": [
                        {
                            "Node Type": "Seq Scan",
                        }
                    ],
                },
                "Planning Time": 0.05,
                "Execution Time": 0.42,
            }
        ]
        cursor = MagicMock()
        cursor.fetchone.return_value = (postgres_plan,)
        cursor_mock.return_value.__enter__.return_value = cursor

        query_plan = ExplainAnalyzer().run(
            "SELECT * FROM users WHERE email = 'abc@test.com';"
        )

        self.assertEqual(QueryPlan.objects.count(), 1)
        self.assertEqual(Recommendation.objects.count(), 3)
        self.assertEqual(query_plan.plan, postgres_plan)
        self.assertEqual(query_plan.planning_time, 0.05)
        self.assertEqual(query_plan.execution_time, 0.42)
        self.assertEqual(
            query_plan.benchmark.query,
            "SELECT * FROM users WHERE email = 'abc@test.com';",
        )
        self.assertEqual(query_plan.benchmark.status, "SUCCESS")
        self.assertEqual(query_plan.benchmark.execution_time_ms, 0.42)
        self.assertQuerySetEqual(
            query_plan.recommendations.order_by("id").values(
                "rule_type", "severity", "message"
            ),
            [
                {
                    "rule_type": "NESTED_LOOP",
                    "severity": "MEDIUM",
                    "message": "Nested loop join detected",
                },
                {
                    "rule_type": "SEQ_SCAN",
                    "severity": "HIGH",
                    "message": "Sequential scan detected",
                },
                {
                    "rule_type": "MISSING_INDEX",
                    "severity": "HIGH",
                    "message": (
                        "Sequential scan detected on a filtered query. "
                        "Consider creating an index on the filtered column."
                    ),
                },
            ],
            transform=lambda value: value,
        )


class PlanAnalyzerTests(SimpleTestCase):
    def test_returns_root_node_type_from_stored_plan_json(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Seq Scan",
                }
            }
        ]

        node_type = PlanAnalyzer().get_root_node_type(plan)

        self.assertEqual(node_type, "Seq Scan")

    def test_returns_all_node_types_from_nested_plan_tree(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Nested Loop",
                    "Plans": [
                        {
                            "Node Type": "Seq Scan",
                        },
                        {
                            "Node Type": "Index Scan",
                        },
                    ],
                }
            }
        ]

        node_types = PlanAnalyzer().get_all_node_types(plan)

        self.assertEqual(node_types, ["Nested Loop", "Seq Scan", "Index Scan"])

    def test_returns_multiple_findings_for_matching_node_types(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Nested Loop",
                    "Plans": [
                        {
                            "Node Type": "Seq Scan",
                        },
                        {
                            "Node Type": "Hash Join",
                            "Plans": [
                                {
                                    "Node Type": "Merge Join",
                                }
                            ],
                        },
                    ],
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(
            plan, "SELECT * FROM users WHERE email = 'abc@test.com';"
        )

        self.assertEqual(
            analysis,
            [
                {
                    "type": "NESTED_LOOP",
                    "severity": "MEDIUM",
                    "message": "Nested loop join detected",
                },
                {
                    "type": "SEQ_SCAN",
                    "severity": "HIGH",
                    "message": "Sequential scan detected",
                },
                {
                    "type": "HASH_JOIN",
                    "severity": "MEDIUM",
                    "message": "Hash join detected",
                },
                {
                    "type": "MERGE_JOIN",
                    "severity": "MEDIUM",
                    "message": "Merge join detected",
                },
                {
                    "type": "MISSING_INDEX",
                    "severity": "HIGH",
                    "message": (
                        "Sequential scan detected on a filtered query. "
                        "Consider creating an index on the filtered column."
                    ),
                },
            ],
        )

    def test_returns_empty_list_for_non_matching_node_types(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Index Scan",
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan, "SELECT * FROM users;")

        self.assertEqual(analysis, [])

    def test_returns_missing_index_for_filtered_seq_scan(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Seq Scan",
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(
            plan, "SELECT * FROM users WHERE email = 'abc@test.com';"
        )

        self.assertEqual(
            analysis,
            [
                {
                    "type": "SEQ_SCAN",
                    "severity": "HIGH",
                    "message": "Sequential scan detected",
                },
                {
                    "type": "MISSING_INDEX",
                    "severity": "HIGH",
                    "message": (
                        "Sequential scan detected on a filtered query. "
                        "Consider creating an index on the filtered column."
                    ),
                },
            ],
        )
