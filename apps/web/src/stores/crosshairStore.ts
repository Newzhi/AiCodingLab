import { create } from 'zustand'

export type TempSource = 'grid' | 'open-meteo' | 'web-scrape' | 'openweather' | 'none' | string
export type Confidence = 'high' | 'medium' | 'low'
export type SourceStatus = 'ok' | 'error' | 'skipped'

export type WeatherSourceRow = {
  id: string
  temp_c: number | null
  status: SourceStatus
  error?: string
}

export type CrosshairState = {
  active: boolean
  screenX: number
  screenY: number
  lat: number | null
  lon: number | null
  tempC: number | null
  source: TempSource
  liveWebWeather: boolean
  multiSourceMode: boolean
  consensusTempC: number | null
  confidence: Confidence
  sources: WeatherSourceRow[]
  primaryUsed: string
  sourcesExpanded: boolean
  regionId: string | null
  regionName: string | null
  regionNameZh: string | null
  regionTempC: number | null
  regionSource: TempSource
  regionAdminLevel: string | null
  useRegionalHud: boolean
  setProbe: (
    patch: Partial<
      Omit<
        CrosshairState,
        'setProbe' | 'reset' | 'setLiveWebWeather' | 'setMultiSourceMode' | 'toggleSourcesExpanded'
      >
    >,
  ) => void
  setLiveWebWeather: (enabled: boolean) => void
  setMultiSourceMode: (enabled: boolean) => void
  toggleSourcesExpanded: () => void
  reset: () => void
}

const initial = {
  active: false,
  screenX: 0,
  screenY: 0,
  lat: null as number | null,
  lon: null as number | null,
  tempC: null as number | null,
  source: 'none' as TempSource,
  liveWebWeather: false,
  multiSourceMode: true,
  consensusTempC: null as number | null,
  confidence: 'low' as Confidence,
  sources: [] as WeatherSourceRow[],
  primaryUsed: 'none',
  sourcesExpanded: false,
  regionId: null as string | null,
  regionName: null as string | null,
  regionNameZh: null as string | null,
  regionTempC: null as number | null,
  regionSource: 'none' as TempSource,
  regionAdminLevel: null as string | null,
  useRegionalHud: false,
}

export const useCrosshairStore = create<CrosshairState>((set) => ({
  ...initial,
  setProbe: (patch) => set((s) => ({ ...s, ...patch })),
  setLiveWebWeather: (liveWebWeather) => set({ liveWebWeather }),
  setMultiSourceMode: (multiSourceMode) => set({ multiSourceMode }),
  toggleSourcesExpanded: () => set((s) => ({ sourcesExpanded: !s.sourcesExpanded })),
  reset: () =>
    set((s) => ({
      ...initial,
      liveWebWeather: s.liveWebWeather,
      multiSourceMode: s.multiSourceMode,
    })),
}))
