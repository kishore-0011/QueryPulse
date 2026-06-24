"use client"

import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { useBenchmarkCompare } from "@/services/benchmarks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const metricLabels = [
  { key: "execution_time_ms", label: "Execution Time", suffix: " ms" },
  { key: "rows_returned", label: "Rows Returned", suffix: "" },
  { key: "planning_time", label: "Planning Time", suffix: " ms" },
]

const costLabels = [
  { key: "startup_cost", label: "Startup Cost", suffix: "" },
  { key: "total_cost", label: "Total Cost", suffix: "" },
  { key: "plan_rows", label: "Plan Rows", suffix: "" },
  { key: "actual_rows", label: "Actual Rows", suffix: "" },
]

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-medium">Failed to load comparison.</p>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function MetricRow({ label, before, after, suffix = "" }) {
  const beforeVal = before ?? "—"
  const afterVal = after ?? "—"
  const diff =
    before != null && after != null
      ? ((before - after) / before) * 100
      : null
  const improved = diff != null && diff > 0

  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b last:border-0 items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-mono text-right">
        {beforeVal}
        {suffix}
      </span>
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm font-mono">
          {afterVal}
          {suffix}
        </span>
        {diff != null && (
          <span
            className={`text-xs font-medium ${
              improved
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            }`}
          >
            {improved ? "↓" : "↑"}
            {Math.abs(diff).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  )
}

function SideCard({ label, data, icon, variant }) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold">{data.execution_time_ms} ms</div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Node Types
          </span>
          <div className="flex flex-wrap gap-1.5">
            {data.node_types?.length > 0 ? (
              data.node_types.map((nt) => (
                <Badge key={nt} variant="outline">
                  {nt}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ComparisonView({ first, second }) {
  const { data, isLoading, isError, error, refetch } = useBenchmarkCompare(
    first,
    second
  )

  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />

  const { first: before, second: after, improvement_percent } = data
  const improved = improvement_percent > 0

  return (
    <div className="space-y-6">
      {/* Improvement Banner */}
      <Card
        className={`border-2 ${
          improved
            ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-destructive/50 bg-destructive/5"
        }`}
      >
        <CardContent className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {improved ? (
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            ) : (
              <TrendingDown className="h-6 w-6 text-destructive" />
            )}
            <span className="text-lg font-medium text-muted-foreground">
              Performance {improved ? "Improved" : "Regressed"}
            </span>
          </div>
          <div
            className={`text-6xl font-bold tracking-tight ${
              improved ? "text-emerald-500" : "text-destructive"
            }`}
          >
            {improved ? "+" : ""}
            {improvement_percent}%
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {before.execution_time_ms} ms → {after.execution_time_ms} ms
          </p>
        </CardContent>
      </Card>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SideCard
          label="Before"
          data={before}
          icon={<Minus className="h-5 w-5 text-muted-foreground" />}
        />
        <SideCard
          label="After"
          data={after}
          icon={
            improved ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )
          }
        />
      </div>

      {/* Metrics Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {metricLabels.map((m) => (
              <MetricRow
                key={m.key}
                label={m.label}
                before={before[m.key]}
                after={after[m.key]}
                suffix={m.suffix}
              />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Cost Metrics
            </p>
            {costLabels.map((m) => {
              const bv = before.cost_metrics?.[m.key]
              const av = after.cost_metrics?.[m.key]
              if (bv === undefined && av === undefined) return null
              return (
                <MetricRow
                  key={m.key}
                  label={m.label}
                  before={bv}
                  after={av}
                  suffix={m.suffix}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Node Type Transitions */}
      {before.node_types?.length > 0 && after.node_types?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Node Type Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex flex-wrap gap-1.5">
                {before.node_types.map((nt) => (
                  <Badge key={nt} variant="secondary">
                    {nt}
                  </Badge>
                ))}
              </div>
              <ArrowDown className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {after.node_types.map((nt) => (
                  <Badge key={nt} variant="default">
                    {nt}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Changes */}
      {(before.recommendations?.length > 0 ||
        after.recommendations?.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight">
            Recommendation Changes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Before
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {before.recommendations?.length > 0 ? (
                  before.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge
                        variant={
                          r.severity === "HIGH" ? "destructive" : "secondary"
                        }
                        className="shrink-0 mt-0.5"
                      >
                        {r.severity}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{r.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No findings</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  After
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {after.recommendations?.length > 0 ? (
                  after.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge
                        variant={
                          r.severity === "HIGH" ? "destructive" : "secondary"
                        }
                        className="shrink-0 mt-0.5"
                      >
                        {r.severity}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{r.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">All resolved</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
