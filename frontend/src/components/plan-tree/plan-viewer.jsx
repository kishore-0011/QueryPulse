"use client"

import { useState } from "react"
import { Maximize2, Minimize2, TreePine } from "lucide-react"
import { useBenchmarkPlan } from "@/services/benchmarks"
import { PlanTree } from "@/components/plan-tree/plan-tree"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

function countNodes(tree) {
  if (!tree) return 0
  let count = 1
  if (tree.children) {
    for (const child of tree.children) {
      count += countNodes(child)
    }
  }
  return count
}

function maxDepth(tree) {
  if (!tree || !tree.children || tree.children.length === 0) return 1
  let deepest = 0
  for (const child of tree.children) {
    deepest = Math.max(deepest, maxDepth(child))
  }
  return deepest + 1
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-medium">Failed to load execution plan.</p>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <TreePine className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium">No execution plan available.</p>
    </div>
  )
}

export function PlanViewer({ id }) {
  const { data: tree, isLoading, isError, error, refetch } = useBenchmarkPlan(id)
  const [allExpanded, setAllExpanded] = useState(true)
  const [treeKey, setTreeKey] = useState(0)

  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!tree || !tree.node) return <EmptyState />

  const totalNodes = countNodes(tree)
  const depth = maxDepth(tree)
  const rootNode = tree.node

  const handleExpandAll = () => {
    setAllExpanded(true)
    setTreeKey((k) => k + 1)
  }

  const handleCollapseAll = () => {
    setAllExpanded(false)
    setTreeKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Execution Plan</h2>
        <p className="text-muted-foreground">
          Benchmark #{id}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Root Node
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default">{rootNode}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalNodes}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tree Depth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{depth}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Plan Tree</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExpandAll}>
              <Maximize2 className="h-4 w-4 mr-1" />
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handleCollapseAll}>
              <Minimize2 className="h-4 w-4 mr-1" />
              Collapse All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card p-4">
            <PlanTree
              key={treeKey}
              tree={tree}
              expandedByDefault={allExpanded}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
