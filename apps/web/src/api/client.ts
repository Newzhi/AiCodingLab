const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'

export type LayerMeta = {
  id: string
  name: string
  type: string
  default?: boolean
  description?: string
  source?: string
}

export async function fetchCatalog(): Promise<LayerMeta[]> {
  const res = await fetch(`${API_BASE}/layers/catalog`)
  if (!res.ok) throw new Error('Failed to load layer catalog')
  const data = await res.json()
  return data.layers
}

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('API health check failed')
  return res.json()
}
