"use client"

import { useState } from "react"
import { CheckCircle, Loader2, Table2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { applyTemplate } from "@/lib/api"

const TEMPLATES = {
  ecommerce: {
    label: "Ecommerce",
    description: "users, products, orders, order_items",
    tables: ["users", "products", "orders", "order_items"],
  },
  crm: {
    label: "CRM",
    description: "customers, leads, deals, campaigns",
    tables: ["customers", "leads", "deals", "campaigns"],
  },
}

export function CreateEnvironmentModal({ onClose, onSuccess }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const result = await applyTemplate(selected)
      setSuccess(result)
      onSuccess?.(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <Card className="relative w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>Create Benchmark Environment</CardTitle>
          <CardDescription>
            Choose a template to create a complete set of tables.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-lg font-medium">
                {success.template.charAt(0).toUpperCase() + success.template.slice(1)} environment created
              </p>
              <p className="text-sm text-muted-foreground">
                {success.tables_created.length} tables added
              </p>
              <Button variant="outline" onClick={onClose}>Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`w-full text-left rounded-lg border p-4 transition-colors ${
                      selected === key
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selected === key
                            ? "border-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selected === key && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tmpl.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {tmpl.description}
                        </p>
                      </div>
                    </div>

                    {selected === key && (
                      <div className="mt-3 pl-7">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                          Tables To Create
                        </p>
                        <div className="space-y-1">
                          {tmpl.tables.map((t) => (
                            <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Table2 className="h-3.5 w-3.5" />
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={loading || !selected}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Creating..." : "Create Environment"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
