"use client"

import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Code,
  Layers,
  BarChart3,
  GitCompareArrows,
  Lightbulb,
  Database,
} from "lucide-react"
import { NavItem } from "@/components/layout/nav-item"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/analyze", icon: Code, label: "Analyze" },
  { href: "/environment", icon: Database, label: "Environment" },
  { href: "/sessions", icon: Layers, label: "Sessions" },
  { href: "/benchmarks", icon: BarChart3, label: "Benchmarks" },
  { href: "/comparisons", icon: GitCompareArrows, label: "Comparisons" },
  { href: "/recommendations", icon: Lightbulb, label: "Recommendations" },
]

export function AppSidebar({ open, onClose }) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-200 md:static md:z-0 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b px-6">
          <span className="text-lg font-bold tracking-tight">QueryPulse</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
            />
          ))}
        </nav>
      </aside>
    </>
  )
}
