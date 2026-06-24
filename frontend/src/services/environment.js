"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchEnvironment } from "@/lib/api"

export function useEnvironment() {
  return useQuery({
    queryKey: ["environment"],
    queryFn: fetchEnvironment,
  })
}
