"use client"

import { useRouter } from "next/navigation"
import { Table2, Eye, Database, Code } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function EnvironmentTable({ table, onSelect, onGenerate }) {
  const router = useRouter()

  return (
    <div className="rounded-xl border bg-card">
      <CardHeader className="flex-row items-center gap-3 pb-3">
        <div className="rounded-lg border bg-muted p-2">
          <Table2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <CardTitle className="text-lg">{table.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {table.row_count.toLocaleString()} rows
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {table.indexes.length} index{table.indexes.length !== 1 ? "es" : ""}
          </Badge>
          <Badge variant="outline">
            {table.columns.length} column{table.columns.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onSelect(table)}>
            <Eye className="h-4 w-4" />
            View Details
          </Button>
          <Button variant="outline" size="sm" onClick={() => onGenerate(table)}>
            <Database className="h-4 w-4" />
            Generate Data
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/analyze")}>
            <Code className="h-4 w-4" />
            Run Benchmark
          </Button>
        </div>
      </CardContent>
    </div>
  )
}
