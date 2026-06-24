import { AppLayout } from "@/components/layout/app-layout"
import { SessionList } from "@/components/session/session-list"

export default function SessionsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sessions</h2>
          <p className="text-muted-foreground">
            Benchmark sessions group before and after comparisons.
          </p>
        </div>
        <SessionList />
      </div>
    </AppLayout>
  )
}
