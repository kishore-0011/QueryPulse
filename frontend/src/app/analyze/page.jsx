"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Play, X, FileText } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/benchmark"

const EXAMPLE_QUERY = `SELECT *
FROM users
WHERE email = 'abc@test.com';`

export default function AnalyzePage() {
  const router = useRouter()
  const textareaRef = useRef(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = el.scrollHeight + "px"
    }
  }, [])

  const handleClear = () => {
    setQuery("")
    setError(null)
  }

  const handleExample = () => {
    setQuery(EXAMPLE_QUERY)
    setError(null)
    requestAnimationFrame(() => autoResize())
  }

  const handleAnalyze = async () => {
    const trimmed = query.trim()
    if (!trimmed) {
      setError("Query cannot be empty")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/explain/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || `Request failed (${res.status})`)
      }

      router.push(`/benchmarks/${data.benchmark_id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analyze Query</h2>
          <p className="text-muted-foreground">
            Paste a SQL query to generate an execution plan and recommendations.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Query</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExample}>
                <FileText className="h-4 w-4 mr-1" />
                Example
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!query}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setError(null)
                autoResize()
              }}
              placeholder="SELECT * FROM users WHERE email = 'abc@test.com';"
              className="flex min-h-[120px] w-full rounded-lg border bg-muted p-4 text-sm font-mono resize-none outline-none focus:ring-1 focus:ring-ring"
              disabled={loading}
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={loading || !query.trim()}
              className="w-full sm:w-auto"
            >
              <Play className="h-4 w-4 mr-2" />
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
