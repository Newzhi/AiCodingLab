import { create } from 'zustand'

export type TempSource = 'grid' | 'open-meteo' | 'web-scrape' | 'none' | string

export type CrosshairState = {
  active: boolean
  screenX: number
  screenY: number
  lat: number | null
  lon: number | null
  tempC: number | null
  source: TempSource
  liveWebWeather: boolean
  setProbe: (patch: Partial<Omit<CrosshairState, 'setProbe' | 'reset' | 'setLiveWebWeather'>>) => void
  setLiveWebWeather: (enabled: boolean) => void
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
}

export const useCrosshairStore = create<CrosshairState>((set) => ({
  ...initial,
  setProbe: (patch) => set((s) => ({ ...s, ...patch })),
  setLiveWebWeather: (liveWebWeather) => set({ liveWebWeather }),
  reset: () => set((s) => ({ ...initial, liveWebWeather: s.liveWebWeather })),
}))
