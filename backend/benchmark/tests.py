from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIRequestFactory

from benchmark.models import Benchmark, BenchmarkSession, QueryPlan, Recommendation
from benchmark.services import ExplainAnalyzer, PlanAnalyzer, PlanTreeBuilder
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
                before_execution_time=None,
                after_execution_time=None,
                improvement_percent=None,
            )
        ]
        benchmark = SimpleNamespace(
            id=1,
            query="SELECT generate_series(1,1000);",
            execution_time_ms=1.83,
            rows_returned=1000,
            query_plan=SimpleNamespace(
                plan=None,
                startup_cost=None,
                total_cost=None,
                plan_rows=None,
                actual_rows=None,
                recommendations=SimpleNamespace(all=lambda: recommendation_list),
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
                "node_type": None,
                "cost_metrics": None,
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
            startup_cost=None,
            total_cost=None,
            plan_rows=None,
            actual_rows=None,
            recommendations=SimpleNamespace(
                all=lambda: [
                    SimpleNamespace(
                        rule_type="SEQ_SCAN",
                        severity="HIGH",
                        message="Sequential scan detected",
                        before_execution_time=None,
                        after_execution_time=None,
                        improvement_percent=None,
                    )
                ]
            ),
        )
        second_plan = SimpleNamespace(
            plan=[{"Plan": {"Node Type": "Index Scan"}}],
            planning_time=0.2,
            startup_cost=None,
            total_cost=None,
            plan_rows=None,
            actual_rows=None,
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
                    "cost_metrics": None,
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
                    "cost_metrics": None,
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
    def test_persists_query_plan_and_cost_metrics_from_postgres(self):
        query_plan = ExplainAnalyzer().run(
            "SELECT * FROM users WHERE email = 'abc@test.com';"
        )

        self.assertEqual(QueryPlan.objects.count(), 1)
        self.assertEqual(query_plan.benchmark.status, "SUCCESS")
        self.assertIsNotNone(query_plan.planning_time)
        self.assertIsNotNone(query_plan.execution_time)
        self.assertIsNotNone(query_plan.startup_cost)
        self.assertIsNotNone(query_plan.total_cost)
        self.assertIsNotNone(query_plan.plan_rows)
        self.assertIsNotNone(query_plan.actual_rows)
        self.assertEqual(query_plan.actual_rows, 0)
        self.assertIsNotNone(query_plan.plan)
        self.assertEqual(
            query_plan.plan[0]["Plan"]["Node Type"],
            "Seq Scan",
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
                    "type": "MISSING_INDEX",
                    "severity": "HIGH",
                    "message": (
                        "Sequential scan detected on a filtered query. "
                        "Consider creating an index on the filtered column."
                    ),
                },
            ],
        )

    def test_detects_under_estimate_row_mismatch(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Index Scan",
                    "Plan Rows": 10,
                    "Actual Rows": 5000,
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(len(analysis), 1)
        self.assertEqual(
            analysis[0],
            {
                "type": "ROW_ESTIMATION_MISMATCH",
                "severity": "MEDIUM",
                "message": (
                    "Planner estimated 10 rows "
                    "but actual execution processed 5000 rows."
                ),
            },
        )

    def test_detects_over_estimate_row_mismatch(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Index Scan",
                    "Plan Rows": 100000,
                    "Actual Rows": 1,
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(len(analysis), 1)
        self.assertEqual(
            analysis[0],
            {
                "type": "ROW_ESTIMATION_MISMATCH",
                "severity": "MEDIUM",
                "message": (
                    "Planner estimated 100000 rows "
                    "but actual execution processed 1 rows."
                ),
            },
        )

    def test_skips_estimate_check_when_both_zero(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Index Scan",
                    "Plan Rows": 0,
                    "Actual Rows": 0,
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(analysis, [])

    def test_skips_cheap_nested_loop(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Nested Loop",
                    "Plan Rows": 50,
                    "Plans": [
                        {"Node Type": "Seq Scan"},
                        {"Node Type": "Index Scan"},
                    ],
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(len(analysis), 0)

    def test_detects_expensive_nested_loop(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Nested Loop",
                    "Plan Rows": 50000,
                    "Plans": [
                        {"Node Type": "Seq Scan"},
                        {"Node Type": "Index Scan"},
                    ],
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(len(analysis), 1)
        self.assertEqual(analysis[0]["type"], "EXPENSIVE_NESTED_LOOP")
        self.assertIn("50000", analysis[0]["message"])
        self.assertEqual(analysis[0]["severity"], "HIGH")

    def test_skips_cheap_seq_scan(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Seq Scan",
                    "Plan Rows": 50,
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(analysis, [])

    def test_detects_expensive_seq_scan(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Seq Scan",
                    "Plan Rows": 100000,
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(len(analysis), 1)
        self.assertEqual(
            analysis[0],
            {
                "type": "EXPENSIVE_SEQ_SCAN",
                "severity": "HIGH",
                "message": (
                    "Sequential scan detected on approximately 100000 rows."
                ),
            },
        )

    def test_detects_expensive_seq_scan_in_nested_plan(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Nested Loop",
                    "Plans": [
                        {
                            "Node Type": "Seq Scan",
                            "Plan Rows": 50000,
                        },
                        {
                            "Node Type": "Index Scan",
                        },
                    ],
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(len(analysis), 1)
        self.assertEqual(analysis[0]["type"], "EXPENSIVE_SEQ_SCAN")

    def test_detects_expensive_nested_loop_in_nested_plan(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Hash Join",
                    "Plan Rows": 200,
                    "Plans": [
                        {
                            "Node Type": "Nested Loop",
                            "Plan Rows": 50000,
                            "Plans": [
                                {"Node Type": "Seq Scan"},
                                {"Node Type": "Index Scan"},
                            ],
                        },
                        {"Node Type": "Seq Scan"},
                    ],
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(len(analysis), 2)
        self.assertEqual(analysis[0]["type"], "HASH_JOIN")
        self.assertEqual(analysis[1]["type"], "EXPENSIVE_NESTED_LOOP")

    def test_skips_estimate_check_when_within_threshold(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Index Scan",
                    "Plan Rows": 100,
                    "Actual Rows": 150,
                }
            }
        ]

        analysis = PlanAnalyzer().analyze(plan)

        self.assertEqual(analysis, [])


class PlanTreeBuilderTests(SimpleTestCase):
    def test_returns_none_for_empty_plan(self):
        self.assertIsNone(PlanTreeBuilder().build(None))
        self.assertIsNone(PlanTreeBuilder().build([]))

    def test_builds_single_node_tree(self):
        plan = [
            {
                "Plan": {
                    "Node Type": "Seq Scan",
                }
            }
        ]

        tree = PlanTreeBuilder().build(plan)

        self.assertEqual(tree, {"node": "Seq Scan", "children": []})

    def test_builds_nested_tree(self):
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

        tree = PlanTreeBuilder().build(plan)

        self.assertEqual(
            tree,
            {
                "node": "Nested Loop",
                "children": [
                    {"node": "Seq Scan", "children": []},
                    {"node": "Index Scan", "children": []},
                ],
            },
        )


class SessionViewTests(TestCase):
    def test_lists_sessions_ordered_by_newest(self):
        BenchmarkSession.objects.create(name="First")
        BenchmarkSession.objects.create(name="Second")

        response = self.client.get("/api/benchmark/sessions/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["name"], "Second")
        self.assertEqual(response.data[1]["name"], "First")

    def test_returns_session_detail_with_benchmarks(self):
        session = BenchmarkSession.objects.create(name="Test Session")

        response = self.client.get(f"/api/benchmark/sessions/{session.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Test Session")
        self.assertEqual(response.data["benchmarks"], [])

    def test_returns_session_summary(self):
        session = BenchmarkSession.objects.create(name="Email Index Benchmark")
        b1 = Benchmark.objects.create(
            session=session,
            query="SELECT * FROM users WHERE email = 'a@test.com';",
            execution_time_ms=7.12,
        )
        b2 = Benchmark.objects.create(
            session=session,
            query="SELECT * FROM users WHERE email = 'a@test.com';",
            execution_time_ms=0.02,
        )
        qp1 = QueryPlan.objects.create(
            benchmark=b1,
            plan=[{"Plan": {"Node Type": "Seq Scan"}}],
            planning_time=0.5,
            execution_time=7.12,
        )
        qp2 = QueryPlan.objects.create(
            benchmark=b2,
            plan=[{"Plan": {"Node Type": "Index Scan"}}],
            planning_time=0.1,
            execution_time=0.02,
        )
        Recommendation.objects.create(
            query_plan=qp1,
            rule_type="MISSING_INDEX",
            severity="HIGH",
            message="Consider creating an index.",
            before_execution_time=7.12,
            after_execution_time=0.02,
            improvement_percent=99.72,
        )
        Recommendation.objects.create(
            query_plan=qp1,
            rule_type="SEQ_SCAN",
            severity="MEDIUM",
            message="Seq scan detected.",
        )
        Recommendation.objects.create(
            query_plan=qp2,
            rule_type="EXPENSIVE_SEQ_SCAN",
            severity="MEDIUM",
            message="No expensive scan.",
        )

        response = self.client.get(
            f"/api/benchmark/sessions/{session.id}/summary/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {
                "session_id": session.id,
                "session_name": "Email Index Benchmark",
                "benchmark_count": 2,
                "before_execution_time_ms": 7.12,
                "after_execution_time_ms": 0.02,
                "improvement_percent": 99.72,
                "recommendation_count": 3,
            },
        )
