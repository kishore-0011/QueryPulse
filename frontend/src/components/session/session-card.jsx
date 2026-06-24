import { Badge } from "@/components/ui/badge"

export function SessionCard({ session }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold leading-none tracking-tight">
              {session.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(session.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary">
            {session.benchmark_count} benchmark{session.benchmark_count !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>
    </div>
  )
}
