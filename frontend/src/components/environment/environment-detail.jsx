"use client"

import { X, Database, ArrowUpRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function EnvironmentDetail({ table, onClose }) {
  if (!table) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-12 md:pt-24">
      <Card className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto mx-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border bg-muted p-2">
              <Database className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">Table: {table.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {table.row_count.toLocaleString()} rows &middot;{" "}
                {table.columns.length} columns &middot;{" "}
                {table.indexes.length} index{table.indexes.length !== 1 ? "es" : ""}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Columns
            </h3>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Name</th>
                    <th className="px-4 py-2 text-left font-medium">Type</th>
                    <th className="px-4 py-2 text-left font-medium">Nullable</th>
                    <th className="px-4 py-2 text-left font-medium">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => (
                    <tr key={col.name} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-sm">{col.name}</td>
                      <td className="px-4 py-2 font-mono text-sm text-muted-foreground">
                        {col.type}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {col.nullable ? (
                          <Badge variant="outline" className="text-xs">
                            YES
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            NO
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {col.default || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {table.indexes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Indexes
              </h3>
              <div className="space-y-2">
                {table.indexes.map((idx) => (
                  <div
                    key={idx.name}
                    className="rounded-lg border p-3"
                  >
                    <code className="text-sm font-mono">{idx.name}</code>
                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                      {idx.definition}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {table.sample_rows?.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Sample Rows
                <span className="font-normal lowercase ml-1">(LIMIT 5)</span>
              </h3>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {Object.keys(table.sample_rows[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-2 text-left font-medium font-mono text-xs"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.sample_rows.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {Object.values(row).map((val, j) => (
                          <td
                            key={j}
                            className="px-4 py-2 font-mono text-xs text-muted-foreground max-w-[200px] truncate"
                          >
                            {val === null ? (
                              <span className="italic text-muted-foreground/50">
                                NULL
                              </span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
