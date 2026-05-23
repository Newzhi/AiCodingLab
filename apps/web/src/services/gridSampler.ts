import { assetUrl, fetchAssets, fetchManifest } from '../api/client'
import type { Confidence, SourceStatus, WeatherSourceRow } from '../stores/crosshairStore'

export type TemperatureGrid = {
  validTime: string
  width: number
  height: number
  bounds: [number, number, number, number]
  values: Float32Array
  source: string
}

export type PointWeatherResponse = {
  temp_c: number | null
  source: string
  fetched_at: string | null
}

export type PointWeatherMultiResponse = {
  lat: number
  lon: number
  consensus_temp_c: number | null
  confidence: Confidence
  sources: WeatherSourceRow[]
  primary_used: string
  fetched_at: string
}

type GridCache = {
  validTime: string
  grid: TemperatureGrid | null
  loading: Promise<TemperatureGrid | null> | null
}

const cache: GridCache = { validTime: '', grid: null, loading: null }

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'

function bilinearSample(
  grid: TemperatureGrid,
  lat: number,
  lon: number,
): number | null {
  const [west, south, east, north] = grid.bounds
  const ln = ((lon + 180) % 360) - 180
  if (lat < south || lat > north || ln < west || ln > east) return null

  const { width, height, values } = grid
  if (width <= 1 || height <= 1) return values[0] ?? null

  const x = ((ln - west) / (east - west)) * (width - 1)
  const y = ((north - lat) / (north - south)) * (height - 1)

  const x0 = Math.floor(x)
  const x1 = Math.min(x0 + 1, width - 1)
  const y0 = Math.floor(y)
  const y1 = Math.min(y0 + 1, height - 1)
  const tx = x - x0
  const ty = y - y0

  const idx = (row: number, col: number) => row * width + col
  return (
    values[idx(y0, x0)] * (1 - tx) * (1 - ty) +
    values[idx(y0, x1)] * tx * (1 - ty) +
    values[idx(y1, x0)] * (1 - tx) * ty +
    values[idx(y1, x1)] * tx * ty
  )
}

export async function loadTemperatureGrid(
  validTime: string,
): Promise<TemperatureGrid | null> {
  if (cache.validTime === validTime && cache.grid) return cache.grid
  if (cache.validTime === validTime && cache.loading) return cache.loading

  cache.validTime = validTime
  cache.grid = null

  const loading = (async () => {
    try {
      const assets = await fetchAssets(validTime, 'temperature')
      if (!assets.files.grid) return null

      const [meta, bin, manifest] = await Promise.all([
        fetch(assetUrl(assets.files.meta)).then((r) => r.json()),
        fetch(assetUrl(assets.files.grid)).then((r) => r.arrayBuffer()),
        fetchManifest(validTime).catch(() => ({
          source: 'demo',
          valid_time: validTime,
          layers: [],
        })),
      ])

      const grid: TemperatureGrid = {
        validTime,
        width: meta.width as number,
        height: meta.height as number,
        bounds: meta.bounds as [number, number, number, number],
        values: new Float32Array(bin),
        source: manifest.source,
      }
      cache.grid = grid
      return grid
    } catch {
      cache.grid = null
      return null
    } finally {
      cache.loading = null
    }
  })()

  cache.loading = loading
  return loading
}

export function sampleGridTemperature(
  grid: TemperatureGrid | null,
  lat: number,
  lon: number,
): number | null {
  if (!grid) return null
  return bilinearSample(grid, lat, lon)
}

function normalizeGridSource(source: string): string {
  return ['demo', 'gfs', 'synthetic'].includes(source) ? 'grid' : source
}

export async function fetchPointWeather(
  lat: number,
  lon: number,
  validTime: string | null,
  options: { preferWeb?: boolean } = {},
): Promise<PointWeatherResponse> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  })
  if (validTime) params.set('valid_time', validTime)
  if (options.preferWeb) {
    params.set('prefer_web', 'true')
    params.set('allow_scrape', 'true')
  }

  try {
    const res = await fetch(`${API_BASE}/weather/point?${params}`)
    if (!res.ok) return { temp_c: null, source: 'none', fetched_at: null }
    const data = await res.json()
    return {
      temp_c: data.temp_c ?? null,
      source: data.source ?? 'none',
      fetched_at: data.fetched_at ?? null,
    }
  } catch {
    return { temp_c: null, source: 'none', fetched_at: null }
  }
}

export async function fetchPointWeatherMulti(
  lat: number,
  lon: number,
  validTime: string | null,
): Promise<PointWeatherMultiResponse | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  })
  if (validTime) params.set('valid_time', validTime)
  params.set('allow_scrape', 'true')

  try {
    const res = await fetch(`${API_BASE}/weather/point/multi?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    const sources: WeatherSourceRow[] = (data.sources ?? []).map(
      (s: { id: string; temp_c: number | null; status: string; error?: string }) => ({
        id: s.id,
        temp_c: s.temp_c ?? null,
        status: (s.status ?? 'error') as SourceStatus,
        error: s.error,
      }),
    )
    return {
      lat: data.lat,
      lon: data.lon,
      consensus_temp_c: data.consensus_temp_c ?? null,
      confidence: data.confidence ?? 'low',
      sources,
      primary_used: data.primary_used ?? 'none',
      fetched_at: data.fetched_at ?? '',
    }
  } catch {
    return null
  }
}

export async function probeTemperature(
  lat: number,
  lon: number,
  validTime: string | null,
  grid: TemperatureGrid | null,
  options: { preferWeb?: boolean; multiSource?: boolean } = {},
): Promise<{
  tempC: number | null
  source: string
  consensusTempC?: number | null
  confidence?: Confidence
  sources?: WeatherSourceRow[]
  primaryUsed?: string
}> {
  if (options.multiSource) {
    const multi = await fetchPointWeatherMulti(lat, lon, validTime)
    if (multi) {
      return {
        tempC: multi.consensus_temp_c,
        source: multi.primary_used,
        consensusTempC: multi.consensus_temp_c,
        confidence: multi.confidence,
        sources: multi.sources,
        primaryUsed: multi.primary_used,
      }
    }
  }

  if (!options.preferWeb) {
    const fromGrid = sampleGridTemperature(grid, lat, lon)
    if (fromGrid !== null && grid) {
      return { tempC: fromGrid, source: normalizeGridSource(grid.source) }
    }
  }

  const remote = await fetchPointWeather(lat, lon, validTime, options)
  return { tempC: remote.temp_c, source: remote.source }
}

export function invalidateGridCache(): void {
  cache.validTime = ''
  cache.grid = null
  cache.loading = null
}
