const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'

export type LayerMeta = {
  id: string
  name: string
  type: string
  default?: boolean
}

export type AssetResponse = {
  valid_time: string
  layer_id: string
  files: Record<string, string>
}

export type TimeManifest = {
  valid_time: string
  source: 'demo' | 'gfs' | 'synthetic' | 'cmems' | string
  layers: string[]
}

export async function fetchCatalog(): Promise<LayerMeta[]> {
  const res = await fetch(`${API_BASE}/layers/catalog`)
  if (!res.ok) throw new Error('Failed to load layer catalog')
  const data = await res.json()
  return data.layers
}

export async function fetchTimes(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/times`)
  if (!res.ok) throw new Error('Failed to load times')
  const data = await res.json()
  return data.times as string[]
}

export async function fetchManifest(validTime: string): Promise<TimeManifest> {
  const encoded = encodeURIComponent(validTime)
  const res = await fetch(`${API_BASE}/times/manifest?valid_time=${encoded}`)
  if (!res.ok) throw new Error(`Manifest not found for ${validTime}`)
  return res.json()
}

export async function fetchAssets(
  validTime: string,
  layerId: string,
): Promise<AssetResponse> {
  const encoded = encodeURIComponent(validTime)
  const res = await fetch(`${API_BASE}/assets/${encoded}/${layerId}`)
  if (!res.ok) throw new Error(`Assets not found: ${layerId} @ ${validTime}`)
  return res.json()
}

export function assetUrl(path: string): string {
  if (path.startsWith('http')) return path
  const base = API_BASE.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
