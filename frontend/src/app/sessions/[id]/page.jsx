import { AppLayout } from "@/components/layout/app-layout"
import { SessionDetail } from "@/components/session/session-detail"

export default function SessionDetailPage({ params }) {
  return (
    <AppLayout>
      <SessionDetail id={params.id} />
    </AppLayout>
  )
}
