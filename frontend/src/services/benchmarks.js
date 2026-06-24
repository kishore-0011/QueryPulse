import { useQuery } from "@tanstack/react-query"
import {
  fetchBenchmarks,
  fetchBenchmark,
  fetchBenchmarkPlan,
  fetchBenchmarkCompare,
} from "@/lib/api"

export function useBenchmarks() {
  return useQuery({
    queryKey: ["benchmarks"],
    queryFn: fetchBenchmarks,
  })
}

export function useBenchmark(id) {
  return useQuery({
    queryKey: ["benchmark", id],
    queryFn: () => fetchBenchmark(id),
    enabled: !!id,
  })
}

export function useBenchmarkPlan(id) {
  return useQuery({
    queryKey: ["benchmark-plan", id],
    queryFn: () => fetchBenchmarkPlan(id),
    enabled: !!id,
  })
}

export function useBenchmarkCompare(first, second) {
  return useQuery({
    queryKey: ["benchmark-compare", first, second],
    queryFn: () => fetchBenchmarkCompare(first, second),
    enabled: !!first && !!second,
  })
}
