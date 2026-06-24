import { AppLayout } from "@/components/layout/app-layout"
import { PlanViewer } from "@/components/plan-tree/plan-viewer"

export default function BenchmarkPlanPage({ params }) {
  return (
    <AppLayout>
      <PlanViewer id={params.id} />
    </AppLayout>
  )
}
