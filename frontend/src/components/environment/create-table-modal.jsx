"use client"

import { useState } from "react"
import { Plus, X, Loader2, CheckCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createTable } from "@/lib/api"

const COLUMN_TYPES = [
  "VARCHAR(255)",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
]

function emptyColumn() {
  return { name: "", type: "BIGINT" }
}

export function CreateTableModal({ onClose, onSuccess }) {
  const [tableName, setTableName] = useState("")
  const [columns, setColumns] = useState([emptyColumn()])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const addColumn = () => setColumns([...columns, emptyColumn()])

  const removeColumn = (index) => {
    if (columns.length <= 1) return
    setColumns(columns.filter((_, i) => i !== index))
  }

  const updateColumn = (index, field, value) => {
    const updated = [...columns]
    updated[index] = { ...updated[index], [field]: value }
    setColumns(updated)
  }

  const validate = () => {
    if (!tableName.trim()) return "Table name is required."
    const seen = new Set()
    for (const col of columns) {
      if (!col.name.trim()) return "All columns require a name."
      if (seen.has(col.name.trim())) return `Duplicate column name: "${col.name}".`
      seen.add(col.name.trim())
    }
    return null
  }

  const handleCreate = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await createTable({
        tableName: tableName.trim(),
        columns: columns.map((c) => ({ name: c.name.trim(), type: c.type })),
      })
      setSuccess(result)
      onSuccess?.(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isValid = tableName.trim() && columns.every((c) => c.name.trim())

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="relative w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        <CardHeader>
          <CardTitle>Create Table</CardTitle>
          <CardDescription>Define a new table in the database.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-lg font-medium">
                Table &ldquo;{success.table_name}&rdquo; created
              </p>
              <p className="text-sm text-muted-foreground">
                {success.column_count} columns
              </p>
              <Button variant="outline" onClick={onClose}>Done</Button>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Table Name</label>
                <input
                  type="text"
                  placeholder="customers"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Columns</label>
                  <Button variant="outline" size="sm" onClick={addColumn}>
                    <Plus className="h-4 w-4" />
                    Add Column
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-5">Type</div>
                    <div className="col-span-2" />
                  </div>
                  {columns.map((col, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="column_name"
                        value={col.name}
                        onChange={(e) => updateColumn(i, "name", e.target.value)}
                        className="col-span-5 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => updateColumn(i, "type", e.target.value)}
                        className="col-span-5 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {COLUMN_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <div className="col-span-2 flex justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={columns.length <= 1}
                          onClick={() => removeColumn(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={loading || !isValid}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Creating..." : "Create Table"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
