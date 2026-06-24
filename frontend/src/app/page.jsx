import { BarChart3, Layers, Lightbulb, TrendingUp } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { StatsGrid } from "@/components/ui/stats-grid"
import { MetricCard } from "@/components/ui/metric-card"

const stats = [
  { title: "Total Benchmarks", value: 128, icon: BarChart3 },
  { title: "Sessions", value: 24, icon: Layers },
  { title: "Recommendations", value: 56, icon: Lightbulb },
  { title: "Avg Improvement", value: "99%", icon: TrendingUp, trend: "+12%" },
]

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to QueryPulse</p>
        </div>

        <StatsGrid>
          {stats.map((stat) => (
            <MetricCard key={stat.title} {...stat} />
          ))}
        </StatsGrid>
      </div>
    </AppLayout>
  )
}
