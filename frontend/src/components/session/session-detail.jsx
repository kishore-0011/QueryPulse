"use client"

import {
  BarChart3,
  Clock,
  Zap,
  Lightbulb,
  TrendingUp,
  ArrowDown,
  Circle,
} from "lucide-react"
import Link from "next/link"
import { useSession, useSessionSummary } from "@/services/sessions"
import { MetricCard } from "@/components/ui/metric-card"
import { StatsGrid } from "@/components/ui/stats-grid"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
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
      <p className="text-lg font-medium">Failed to load session.</p>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

export function SessionDetail({ id }) {
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useSessionSummary(id)

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useSession(id)

  if (summaryLoading || detailLoading) return <LoadingSkeleton />
  if (summaryError || detailError)
    return (
      <ErrorState
        error={summaryErr}
        onRetry={() => {
          refetchSummary()
        }}
      />
    )

  const benchmarks = detail?.benchmarks || []
  const isImproved =
    summary.improvement_percent !== null && summary.improvement_percent > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {summary.session_name}
        </h2>
        <p className="text-muted-foreground">Session #{summary.session_id}</p>
      </div>

      <StatsGrid>
        <MetricCard
          title="Benchmarks"
          value={summary.benchmark_count}
          icon={BarChart3}
        />
        <MetricCard
          title="Before Time"
          value={`${summary.before_execution_time_ms ?? "—"} ms`}
          icon={Clock}
        />
        <MetricCard
          title="After Time"
          value={`${summary.after_execution_time_ms ?? "—"} ms`}
          icon={Zap}
        />
        <MetricCard
          title="Recommendations"
          value={summary.recommendation_count}
          icon={Lightbulb}
        />
      </StatsGrid>

      {summary.improvement_percent !== null && (
        <Card className={isImproved ? "border-emerald-500/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Performance Improvement
            </span>
            {isImproved ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-5xl font-bold tracking-tight ${
                isImproved ? "text-emerald-500" : "text-destructive"
              }`}
            >
              {isImproved ? "+" : ""}
              {summary.improvement_percent}%
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {isImproved
                ? `${summary.before_execution_time_ms} ms → ${summary.after_execution_time_ms} ms`
                : "No improvement detected"}
            </p>
          </CardContent>
        </Card>
      )}

      {benchmarks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight">
            Benchmark Timeline
          </h3>

          <div className="relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

            <div className="space-y-8">
              {benchmarks.map((benchmark, index) => {
                const isBefore =
                  index === 0 && benchmarks.length > 1
                const label = isBefore ? "Before Index" : "After Index"

                return (
                  <div key={benchmark.benchmark_id} className="relative flex gap-4">
                    <div className="flex shrink-0 flex-col items-center">
                      <Circle
                        className={`h-6 w-6 ${
                          isBefore
                            ? "text-muted-foreground"
                            : "text-emerald-500"
                        }`}
                      />
                    </div>

                    <div className="flex-1 space-y-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{label}</span>
                        <Badge variant={isBefore ? "secondary" : "default"}>
                          {benchmark.execution_time_ms} ms
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-lg">
                        {benchmark.query}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {benchmark.node_types?.map((nt) => (
                          <Badge key={nt} variant="outline" className="text-xs">
                            {nt}
                          </Badge>
                        ))}
                      </div>
                      {benchmark.recommendations?.length > 0 && (
                        <Link
                          href={`/recommendations?benchmark=${benchmark.benchmark_id}`}
                          className="text-xs text-primary hover:underline inline-block mt-1"
                        >
                          {benchmark.recommendations.length} recommendation
                          {benchmark.recommendations.length > 1 ? "s" : ""}
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
