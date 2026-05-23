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

export type RegionWeatherResponse = {
  region_id: string | null
  name: string | null
  name_zh: string | null
  admin_level: string | null
  temp_c: number | null
  temp_max_c: number | null
  source: string
  confidence: string
  bounds: number[] | null
  valid_time: string | null
  cell_count?: number | null
}

export async function fetchRegionWeather(
  lat: number,
  lon: number,
  validTime: string | null,
): Promise<RegionWeatherResponse> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  })
  if (validTime) params.set('valid_time', validTime)
  try {
    const res = await fetch(`${API_BASE}/weather/region?${params}`)
    if (!res.ok) {
      return {
        region_id: null,
        name: null,
        name_zh: null,
        admin_level: null,
        temp_c: null,
        temp_max_c: null,
        source: 'none',
        confidence: 'low',
        bounds: null,
        valid_time: validTime,
      }
    }
    return res.json()
  } catch {
    return {
      region_id: null,
      name: null,
      name_zh: null,
      admin_level: null,
      temp_c: null,
      temp_max_c: null,
      source: 'none',
      confidence: 'low',
      bounds: null,
      valid_time: validTime,
    }
  }
}

export type GeoFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: string
    properties?: Record<string, unknown>
    geometry: unknown
  }>
}

export async function fetchCountriesGeoJson(): Promise<GeoFeatureCollection> {
  const res = await fetch(`${API_BASE}/boundaries/countries`)
  if (!res.ok) throw new Error('Failed to load country boundaries')
  return res.json()
}

export async function fetchChinaProvincesGeoJson(): Promise<GeoFeatureCollection> {
  const res = await fetch(`${API_BASE}/boundaries/china_provinces`)
  if (!res.ok) throw new Error('Failed to load China province boundaries')
  return res.json()
}
