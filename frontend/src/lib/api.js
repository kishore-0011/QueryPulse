const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/benchmark"

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export function fetchSessions() {
  return request("/sessions/")
}

export function fetchSession(id) {
  return request(`/sessions/${id}/`)
}

export function fetchSessionSummary(id) {
  return request(`/sessions/${id}/summary/`)
}

export function fetchBenchmarks() {
  return request("/")
}

export function fetchBenchmark(id) {
  return request(`/${id}/`)
}

export function fetchBenchmarkPlan(id) {
  return request(`/${id}/plan/`)
}

export function fetchBenchmarkCompare(first, second) {
  return request(`/compare/?first=${first}&second=${second}`)
}

export function fetchRecommendations() {
  return request("/recommendations/")
}

export function fetchEnvironment() {
  return request("/environment/")
}

export function generateTableData(tableName, rows) {
  return request(`/environment/tables/${tableName}/generate/`, {
    method: "POST",
    body: JSON.stringify({ rows }),
  })
}

export function createTable({ tableName, columns }) {
  return request("/environment/tables/", {
    method: "POST",
    body: JSON.stringify({ table_name: tableName, columns }),
  })
}

export function applyTemplate(template) {
  return request("/environment/templates/", {
    method: "POST",
    body: JSON.stringify({ template }),
  })
}
