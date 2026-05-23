import { create } from 'zustand'

export type LayerError = {
  layerId: string
  message: string
  at: number
}

type LayerErrorState = {
  errors: Record<string, LayerError>
  setError: (layerId: string, message: string) => void
  clearError: (layerId: string) => void
  clearAll: () => void
}

export const useLayerErrorStore = create<LayerErrorState>((set) => ({
  errors: {},
  setError: (layerId, message) =>
    set((s) => ({
      errors: {
        ...s.errors,
        [layerId]: { layerId, message, at: Date.now() },
      },
    })),
  clearError: (layerId) =>
    set((s) => {
      const next = { ...s.errors }
      delete next[layerId]
      return { errors: next }
    }),
  clearAll: () => set({ errors: {} }),
}))
