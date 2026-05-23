import { create } from 'zustand'
import { DEFAULT_LAYER_VISIBILITY } from '../config/layerRegistry'

export type LayerId =
  | 'basemap'
  | 'temperature'
  | 'terrain_contours'
  | 'wind'
  | 'ocean'

type LayerState = {
  layers: Record<LayerId, boolean>
  currentTime: string | null
  tempRange: { min: number; max: number } | null
  setLayer: (id: LayerId, visible: boolean) => void
  setCurrentTime: (time: string) => void
  setTempRange: (range: { min: number; max: number } | null) => void
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: { ...DEFAULT_LAYER_VISIBILITY },
  currentTime: null,
  tempRange: null,
  setLayer: (id, visible) =>
    set((s) => ({ layers: { ...s.layers, [id]: visible } })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setTempRange: (tempRange) => set({ tempRange }),
}))
