import { useQuery } from "@tanstack/react-query"
import { fetchSessions, fetchSession, fetchSessionSummary } from "@/lib/api"

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  })
}

export function useSession(id) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => fetchSession(id),
    enabled: !!id,
  })
}

export function useSessionSummary(id) {
  return useQuery({
    queryKey: ["session-summary", id],
    queryFn: () => fetchSessionSummary(id),
    enabled: !!id,
  })
}
