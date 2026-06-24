"use client"

import { useState, useMemo } from "react"
import {
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Filter,
} from "lucide-react"
import Link from "next/link"
import { AppLayout } from "@/components/layout/app-layout"
import { useRecommendations } from "@/services/recommendations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const severityVariant = {
  HIGH: "destructive",
  MEDIUM: "secondary",
  LOW: "outline",
}

function LoadingSkeleton() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <AppLayout>
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-lg font-medium">Failed to load recommendations.</p>
        <p className="text-sm text-muted-foreground">{error?.message}</p>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </AppLayout>
  )
}

function EmptyState() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Lightbulb className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">No recommendations yet</p>
        <p className="text-sm text-muted-foreground">
          Run a benchmark to generate recommendations.
        </p>
      </div>
    </AppLayout>
  )
}

export default function RecommendationsPage() {
  const { data: recommendations, isLoading, isError, error, refetch } =
    useRecommendations()

  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const severities = useMemo(() => {
    if (!recommendations) return []
    return ["all", ...new Set(recommendations.map((r) => r.severity))]
  }, [recommendations])

  const types = useMemo(() => {
    if (!recommendations) return []
    return ["all", ...new Set(recommendations.map((r) => r.type))]
  }, [recommendations])

  const filtered = useMemo(() => {
    if (!recommendations) return []
    return recommendations.filter((r) => {
      if (filterSeverity !== "all" && r.severity !== filterSeverity) return false
      if (filterType !== "all" && r.type !== filterType) return false
      return true
    })
  }, [recommendations, filterSeverity, filterType])

  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!recommendations || recommendations.length === 0) return <EmptyState />

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recommendations</h2>
          <p className="text-muted-foreground">
            All findings across benchmarks.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Severity:</span>
                <div className="flex gap-1">
                  {severities.map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterSeverity(s)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        filterSeverity === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All" : t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {recommendations.length} recommendation
          {recommendations.length !== 1 ? "s" : ""}
        </p>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Badge
                    variant={severityVariant[rec.severity] || "outline"}
                    className="shrink-0 mt-0.5"
                  >
                    {rec.severity}
                  </Badge>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{rec.type}</span>
                      {rec.benchmark_id && (
                        <Link
                          href={`/benchmarks/${rec.benchmark_id}`}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          #{rec.benchmark_id}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {rec.message}
                    </p>

                    {rec.severity === "HIGH" && (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    )}

                    {/* Evidence section */}
                    {(rec.before_execution_time != null ||
                      rec.improvement_percent != null) && (
                      <div className="rounded-lg bg-muted p-3 space-y-1.5">
                        {rec.before_execution_time != null && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Before
                            </span>
                            <span className="font-mono font-medium">
                              {rec.before_execution_time} ms
                            </span>
                          </div>
                        )}
                        {rec.after_execution_time != null && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              After
                            </span>
                            <span className="font-mono font-medium">
                              {rec.after_execution_time} ms
                            </span>
                          </div>
                        )}
                        {rec.improvement_percent != null && (
                          <div className="flex justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground">
                              Improvement
                            </span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {rec.improvement_percent}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Session context */}
                    {rec.session_name && (
                      <p className="text-xs text-muted-foreground">
                        Session: {rec.session_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
