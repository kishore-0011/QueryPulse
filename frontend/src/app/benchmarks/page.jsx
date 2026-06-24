"use client"

import Link from "next/link"
import { BarChart3, ExternalLink } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { useBenchmarks } from "@/services/benchmarks"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingSkeleton() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
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
        <p className="text-lg font-medium">Failed to load benchmarks.</p>
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
        <BarChart3 className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">No benchmarks yet</p>
        <p className="text-sm text-muted-foreground">
          Run a query from the{" "}
          <Link href="/analyze" className="text-primary hover:underline">
            Analyze
          </Link>{" "}
          page to get started.
        </p>
      </div>
    </AppLayout>
  )
}

export default function BenchmarksPage() {
  const { data: benchmarks, isLoading, isError, error, refetch } = useBenchmarks()

  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!benchmarks || benchmarks.length === 0) return <EmptyState />

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Benchmarks</h2>
          <p className="text-muted-foreground">
            All query benchmark runs.
          </p>
        </div>

        <div className="grid gap-4">
          {benchmarks.map((b) => (
            <Card key={b.benchmark_id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{b.benchmark_id}</span>
                      <Badge variant="secondary">{b.execution_time_ms} ms</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {b.query}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()}{" "}
                      {new Date(b.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Link
                    href={`/benchmarks/${b.benchmark_id}`}
                    className="shrink-0 text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Details <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
