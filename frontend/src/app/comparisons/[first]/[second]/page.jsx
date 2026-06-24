import { AppLayout } from "@/components/layout/app-layout"
import { ComparisonView } from "@/components/comparison/comparison-view"

export default function ComparisonPage({ params }) {
  return (
    <AppLayout>
      <ComparisonView first={params.first} second={params.second} />
    </AppLayout>
  )
}
