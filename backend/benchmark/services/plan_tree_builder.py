class PlanTreeBuilder:
    def build(self, plan):
        if not plan:
            return None

        root = plan[0].get("Plan", {})
        return self._build_node(root)

    def _build_node(self, plan_node):
        if not plan_node:
            return None

        node = {"node": plan_node.get("Node Type"), "children": []}

        for child in plan_node.get("Plans", []):
            child_node = self._build_node(child)
            if child_node:
                node["children"].append(child_node)

        return node
