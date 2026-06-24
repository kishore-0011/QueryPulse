import { EnvironmentView } from "@/components/environment/environment-view"
import { AppLayout } from "@/components/layout/app-layout"

export const metadata = {
  title: "Environment - QueryPulse",
}

export default function EnvironmentPage() {
  return (
    <AppLayout title="Database Environment"
      description="Explore tables, columns, indexes, and sample data in your database."
    >
      <EnvironmentView />
    </AppLayout>
  )
}
