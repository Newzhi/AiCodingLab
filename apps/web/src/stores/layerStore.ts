import { create } from 'zustand'
import { DEFAULT_LAYER_VISIBILITY } from '../config/layerRegistry'

export type LayerId = 'basemap' | 'terrain' | 'hillshade' | 'roads'

type LayerState = {
  layers: Record<LayerId, boolean>
  setLayer: (id: LayerId, visible: boolean) => void
}

export const useLayerStore = create<LayerState>((set) => ({
  layers: { ...DEFAULT_LAYER_VISIBILITY },
  setLayer: (id, visible) =>
    set((s) => ({ layers: { ...s.layers, [id]: visible } })),
}))
