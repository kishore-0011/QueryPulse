"use client"

import { Layers } from "lucide-react"
import { useSessions } from "@/services/sessions"
import { SessionCard } from "@/components/session/session-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Layers className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-lg font-medium">No benchmark sessions found</p>
        <p className="text-sm text-muted-foreground">
          Create your first benchmark.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-medium">Failed to load sessions.</p>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

export function SessionList() {
  const { data: sessions, isLoading, isError, error, refetch } = useSessions()

  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!sessions || sessions.length === 0) return <EmptyState />

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  )
}
