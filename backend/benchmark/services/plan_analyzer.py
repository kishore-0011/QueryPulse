class PlanAnalyzer:
    FINDING_RULES = {
        "Seq Scan": {
            "type": "SEQ_SCAN",
            "severity": "HIGH",
            "message": "Sequential scan detected",
        },
        "Nested Loop": {
            "type": "NESTED_LOOP",
            "severity": "MEDIUM",
            "message": "Nested loop join detected",
        },
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

        if "Seq Scan" in node_types and self._has_where_clause(query):
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

        return findings

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
