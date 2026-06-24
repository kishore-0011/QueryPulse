import { useQuery } from "@tanstack/react-query"
import { fetchRecommendations } from "@/lib/api"

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  })
}
