"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GitCompareArrows, ArrowRight } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function ComparisonsPage() {
  const router = useRouter()
  const [first, setFirst] = useState("")
  const [second, setSecond] = useState("")

  const handleCompare = () => {
    if (first.trim() && second.trim()) {
      router.push(`/comparisons/${first.trim()}/${second.trim()}`)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-lg">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comparisons</h2>
          <p className="text-muted-foreground">
            Compare two benchmarks side by side.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Benchmarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Before</label>
                <input
                  type="number"
                  placeholder="Benchmark ID"
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                />
              </div>
              <div className="pb-1.5">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">After</label>
                <input
                  type="number"
                  placeholder="Benchmark ID"
                  value={second}
                  onChange={(e) => setSecond(e.target.value)}
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                />
              </div>
            </div>

            <Button
              onClick={handleCompare}
              disabled={!first.trim() || !second.trim()}
              className="w-full"
            >
              <GitCompareArrows className="h-4 w-4 mr-2" />
              Compare
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
