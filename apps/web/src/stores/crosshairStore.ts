import { create } from 'zustand'

export type CrosshairState = {
  active: boolean
  screenX: number
  screenY: number
  lat: number | null
  lon: number | null
  setProbe: (
    patch: Partial<Pick<CrosshairState, 'active' | 'screenX' | 'screenY' | 'lat' | 'lon'>>,
  ) => void
  reset: () => void
}

const initial = {
  active: false,
  screenX: 0,
  screenY: 0,
  lat: null as number | null,
  lon: null as number | null,
}

export const useCrosshairStore = create<CrosshairState>((set) => ({
  ...initial,
  setProbe: (patch) => set((s) => ({ ...s, ...patch })),
  reset: () => set(initial),
}))
