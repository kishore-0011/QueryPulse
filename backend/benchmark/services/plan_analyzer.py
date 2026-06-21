class PlanAnalyzer:
    EXPENSIVE_SEQ_SCAN_THRESHOLD = 10000
    EXPENSIVE_NESTED_LOOP_THRESHOLD = 10000
    FINDING_RULES = {
        "Hash Join": {
            "type": "HASH_JOIN",
            "severity": "MEDIUM",
            "message": "Hash join detected",
        },
        "Merge Join": {
            "type": "MERGE_JOIN",
            "severity": "MEDIUM",
            "message": "Merge join detected",
        },
    }
    ROW_ESTIMATION_RATIO_THRESHOLD = 5

    def get_root_node_type(self, plan):
        if not plan:
            return None

        root_plan = plan[0].get("Plan", {})
        return root_plan.get("Node Type")

    def get_all_node_types(self, plan):
        if not plan:
            return []

        node_types = []
        self._collect_node_types(plan[0].get("Plan", {}), node_types)
        return node_types

    def analyze(self, plan, query=""):
        node_types = self.get_all_node_types(plan)
        findings = []

        for node_type in node_types:
            finding = self.FINDING_RULES.get(node_type)
            if finding:
                findings.append(finding)

        if "Seq Scan" in node_types:
            self._check_expensive_seq_scans(plan, findings)

            if self._has_where_clause(query):
                findings.append(
                    {
                        "type": "MISSING_INDEX",
                        "severity": "HIGH",
                        "message": (
                            "Sequential scan detected on a filtered query. "
                            "Consider creating an index on the filtered column."
                        ),
                    }
                )

        if "Nested Loop" in node_types:
            self._check_expensive_nested_loops(plan, findings)

        self._check_row_estimate(plan, findings)

        return findings

    def _check_expensive_seq_scans(self, plan, findings):
        seq_scans = []
        self._collect_seq_scan_nodes(
            plan[0].get("Plan", {}) if plan else {}, seq_scans
        )

        for plan_rows in seq_scans:
            if plan_rows is not None and plan_rows > self.EXPENSIVE_SEQ_SCAN_THRESHOLD:
                findings.append(
                    {
                        "type": "EXPENSIVE_SEQ_SCAN",
                        "severity": "HIGH",
                        "message": (
                            f"Sequential scan detected on approximately "
                            f"{plan_rows} rows."
                        ),
                    }
                )

    def _collect_seq_scan_nodes(self, plan_node, seq_scans):
        if not plan_node:
            return

        if plan_node.get("Node Type") == "Seq Scan":
            seq_scans.append(plan_node.get("Plan Rows"))

        for child_node in plan_node.get("Plans", []):
            self._collect_seq_scan_nodes(child_node, seq_scans)

    def _check_expensive_nested_loops(self, plan, findings):
        nested_loops = []
        self._collect_nested_loop_nodes(
            plan[0].get("Plan", {}) if plan else {}, nested_loops
        )

        for plan_rows in nested_loops:
            if plan_rows is not None and plan_rows > self.EXPENSIVE_NESTED_LOOP_THRESHOLD:
                findings.append(
                    {
                        "type": "EXPENSIVE_NESTED_LOOP",
                        "severity": "HIGH",
                        "message": (
                            f"Nested loop detected on approximately "
                            f"{plan_rows} rows. Consider reviewing "
                            f"join strategy and indexes."
                        ),
                    }
                )

    def _collect_nested_loop_nodes(self, plan_node, nested_loops):
        if not plan_node:
            return

        if plan_node.get("Node Type") == "Nested Loop":
            nested_loops.append(plan_node.get("Plan Rows"))

        for child_node in plan_node.get("Plans", []):
            self._collect_nested_loop_nodes(child_node, nested_loops)

    def _check_row_estimate(self, plan, findings):
        root_plan = plan[0].get("Plan", {}) if plan else {}
        plan_rows = root_plan.get("Plan Rows")
        actual_rows = root_plan.get("Actual Rows")

        if plan_rows is None or actual_rows is None:
            return

        if plan_rows == 0 and actual_rows == 0:
            return

        if actual_rows == 0:
            if plan_rows > self.ROW_ESTIMATION_RATIO_THRESHOLD:
                findings.append(self._build_estimate_finding(plan_rows, actual_rows))
            return

        if plan_rows == 0:
            if actual_rows > self.ROW_ESTIMATION_RATIO_THRESHOLD:
                findings.append(self._build_estimate_finding(plan_rows, actual_rows))
            return

        ratio = max(plan_rows / actual_rows, actual_rows / plan_rows)
        if ratio > self.ROW_ESTIMATION_RATIO_THRESHOLD:
            findings.append(self._build_estimate_finding(plan_rows, actual_rows))

    def _build_estimate_finding(self, plan_rows, actual_rows):
        return {
            "type": "ROW_ESTIMATION_MISMATCH",
            "severity": "MEDIUM",
            "message": (
                f"Planner estimated {plan_rows} rows "
                f"but actual execution processed {actual_rows} rows."
            ),
        }

    def _collect_node_types(self, plan_node, node_types):
        if not plan_node:
            return

        node_type = plan_node.get("Node Type")
        if node_type:
            node_types.append(node_type)

        for child_node in plan_node.get("Plans", []):
            self._collect_node_types(child_node, node_types)

    def _has_where_clause(self, query):
        return "WHERE" in query.upper()
