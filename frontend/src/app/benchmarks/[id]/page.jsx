import { AppLayout } from "@/components/layout/app-layout"
import { BenchmarkDetail } from "@/components/benchmark/benchmark-detail"

export default function BenchmarkDetailPage({ params }) {
  return (
    <AppLayout>
      <BenchmarkDetail id={params.id} />
    </AppLayout>
  )
}
