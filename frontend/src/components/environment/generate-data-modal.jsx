"use client"

import { useState } from "react"
import { Loader2, CheckCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateTableData } from "@/lib/api"

const ROW_OPTIONS = [
  { value: 1000, label: "1,000" },
  { value: 10000, label: "10,000" },
  { value: 100000, label: "100,000" },
]

export function GenerateDataModal({ table, onClose, onSuccess }) {
  const [selected, setSelected] = useState(1000)
  const [customValue, setCustomValue] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const getRowCount = () => {
    if (isCustom) {
      const n = parseInt(customValue, 10)
      return isNaN(n) || n < 1 ? null : n
    }
    return selected
  }

  const handleGenerate = async () => {
    const rows = getRowCount()
    if (!rows) return
    setLoading(true)
    setError(null)
    try {
      const result = await generateTableData(table.name, rows)
      setSuccess(result)
      onSuccess?.(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isValid = getRowCount() !== null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="relative w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Generate Dataset</CardTitle>
          <CardDescription>
            Add rows to <code className="text-sm font-mono">{table.name}</code>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-lg font-medium">
                {success.rows_created.toLocaleString()} rows generated successfully
              </p>
              <Button variant="outline" onClick={onClose}>Done</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {ROW_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={!isCustom && selected === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelected(opt.value); setIsCustom(false) }}
                  >
                    {opt.label}
                  </Button>
                ))}
                <Button
                  variant={isCustom ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsCustom(true)}
                >
                  Custom
                </Button>
              </div>

              {isCustom && (
                <input
                  type="number"
                  min="1"
                  placeholder="Enter row count..."
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={loading || !isValid}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Generating..." : "Generate"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
