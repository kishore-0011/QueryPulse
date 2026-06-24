"use client"

import { Copy, Check, Eye, GitCompareArrows } from "lucide-react"
import { useState } from "react"
import { useBenchmark } from "@/services/benchmarks"
import { MetricCard } from "@/components/ui/metric-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const severityVariant = {
  HIGH: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-medium">Failed to load benchmark.</p>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

export function BenchmarkDetail({ id }) {
  const { data, isLoading, isError, error, refetch } = useBenchmark(id)
  const [copied, setCopied] = useState(false)

  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!data) return <p className="text-muted-foreground p-6">No data available.</p>

  const { cost_metrics: cost } = data

  const handleCopy = () => {
    navigator.clipboard.writeText(data.query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Benchmark #{data.benchmark_id}
        </h2>
      </div>

      {/* Section 1: Query Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Query</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-all">
            {data.query}
          </pre>
        </CardContent>
      </Card>

      {/* Section 2: Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight mb-4">Metrics</h3>
        <StatsGrid>
          <MetricCard
            title="Execution Time"
            value={`${data.execution_time_ms} ms`}
          />
          <MetricCard title="Rows Returned" value={data.rows_returned} />
          {cost?.startup_cost !== undefined && (
            <MetricCard title="Startup Cost" value={cost.startup_cost} />
          )}
          {cost?.total_cost !== undefined && (
            <MetricCard title="Total Cost" value={cost.total_cost} />
          )}
          {cost?.plan_rows !== undefined && (
            <MetricCard title="Plan Rows" value={cost.plan_rows} />
          )}
          {cost?.actual_rows !== undefined && (
            <MetricCard title="Actual Rows" value={cost.actual_rows} />
          )}
        </StatsGrid>
      </div>

      {/* Section 3: Recommendation Panel */}
      {data.recommendations?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight">
            Recommendations
          </h3>
          <div className="grid gap-4">
            {data.recommendations.map((rec, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Badge variant={severityVariant[rec.severity] || "outline"}>
                      {rec.severity}
                    </Badge>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium text-sm">{rec.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {rec.message}
                      </p>
                      {rec.improvement_percent !== null && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                          Improvement: {rec.improvement_percent}%
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Node Types */}
      {data.node_type && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold tracking-tight">Node Types</h3>
          <div className="flex flex-wrap gap-2">
            {data.node_type.split(", ").map((nt) => (
              <Badge key={nt} variant="secondary">
                {nt}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button variant="default" asChild>
          <a href={`/benchmarks/${data.benchmark_id}/plan`}>
            <Eye className="h-4 w-4 mr-2" />
            View Plan Tree
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={`/compare?first=${data.benchmark_id}`}>
            <GitCompareArrows className="h-4 w-4 mr-2" />
            Compare Benchmark
          </a>
        </Button>
      </div>
    </div>
  )
}
