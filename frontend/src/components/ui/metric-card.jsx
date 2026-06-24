import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MetricCard({ title, value, description, icon: Icon, trend, className }) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {trend && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              {trend}
            </span>
          )}
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
