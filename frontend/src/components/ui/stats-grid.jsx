import { cn } from "@/lib/utils"

export function StatsGrid({ children, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
        className
      )}
    >
      {children}
    </div>
  )
}
