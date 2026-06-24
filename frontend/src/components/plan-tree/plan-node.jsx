"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const categoryStyle = {
  JOIN: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  SCAN: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  INDEX: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  BITMAP: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700",
  SORT: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400 dark:border-zinc-700",
  AGGREGATE: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
}

function getNodeCategory(nodeType) {
  if (
    nodeType === "Nested Loop" ||
    nodeType === "Hash Join" ||
    nodeType === "Merge Join"
  )
    return "JOIN"
  if (nodeType === "Seq Scan" || nodeType === "Parallel Seq Scan")
    return "SCAN"
  if (
    nodeType === "Index Scan" ||
    nodeType === "Index Only Scan" ||
    nodeType === "Index Scan Backward"
  )
    return "INDEX"
  if (nodeType?.includes("Bitmap")) return "BITMAP"
  if (nodeType === "Sort") return "SORT"
  if (
    nodeType === "Aggregate" ||
    nodeType === "Group Aggregate" ||
    nodeType === "HashAggregate"
  )
    return "AGGREGATE"
  return "SCAN"
}

export function PlanNode({ node, depth = 0, expandedByDefault = true }) {
  const [expanded, setExpanded] = useState(expandedByDefault)
  const hasChildren = node.children && node.children.length > 0
  const category = getNodeCategory(node.node)
  const style = categoryStyle[category]

  return (
    <div>
      <div className="flex items-center gap-2 py-0.5">
        {depth > 0 && (
          <div
            className="flex shrink-0 items-center"
            style={{ width: depth * 20 }}
          >
            <div className="h-px w-4 bg-border" />
          </div>
        )}

        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span>{node.node}</span>
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">{node.node}</span>
        )}

        <Badge className={style}>{category}</Badge>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child, i) => (
            <PlanNode
              key={i}
              node={child}
              depth={depth + 1}
              expandedByDefault={expandedByDefault}
            />
          ))}
        </div>
      )}
    </div>
  )
}
