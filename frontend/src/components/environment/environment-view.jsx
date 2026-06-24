"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, LayoutTemplate } from "lucide-react"
import { useEnvironment } from "@/services/environment"
import { EnvironmentTable } from "@/components/environment/environment-table"
import { EnvironmentDetail } from "@/components/environment/environment-detail"
import { GenerateDataModal } from "@/components/environment/generate-data-modal"
import { CreateTableModal } from "@/components/environment/create-table-modal"
import { CreateEnvironmentModal } from "@/components/environment/create-environment-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-medium">Failed to load environment.</p>
      <p className="text-sm text-muted-foreground">{error?.message}</p>
      <Button variant="outline" onClick={onRetry}>Try again</Button>
    </div>
  )
}

export function EnvironmentView() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useEnvironment()
  const [selectedTable, setSelectedTable] = useState(null)
  const [generateTable, setGenerateTable] = useState(null)
  const [showCreateTable, setShowCreateTable] = useState(false)
  const [showCreateEnv, setShowCreateEnv] = useState(false)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["environment"] })
  }

  if (isLoading) return <LoadingSkeleton />
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!data?.tables?.length) return <p className="text-muted-foreground">No tables found.</p>

  return (
    <div>
      <div className="flex justify-end gap-2 mb-6">
        <Button variant="outline" onClick={() => setShowCreateEnv(true)}>
          <LayoutTemplate className="h-4 w-4" />
          Create Environment
        </Button>
        <Button onClick={() => setShowCreateTable(true)}>
          <Plus className="h-4 w-4" />
          Create Table
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.tables.map((table) => (
          <EnvironmentTable
            key={table.name}
            table={table}
            onSelect={setSelectedTable}
            onGenerate={setGenerateTable}
          />
        ))}
      </div>

      {selectedTable && (
        <EnvironmentDetail
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}

      {generateTable && (
        <GenerateDataModal
          table={generateTable}
          onClose={() => setGenerateTable(null)}
          onSuccess={handleRefresh}
        />
      )}

      {showCreateTable && (
        <CreateTableModal
          onClose={() => setShowCreateTable(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showCreateEnv && (
        <CreateEnvironmentModal
          onClose={() => setShowCreateEnv(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
}
