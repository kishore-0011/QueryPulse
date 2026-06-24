import { PlanNode } from "./plan-node"

export function PlanTree({ tree, expandedByDefault = true }) {
  if (!tree) return null

  return (
    <div className="font-mono text-sm">
      <PlanNode node={tree} depth={0} expandedByDefault={expandedByDefault} />
    </div>
  )
}
