import { create } from 'zustand'
import type { Viewer } from 'cesium'

type ViewerStore = {
  viewer: Viewer | null
  setViewer: (viewer: Viewer | null) => void
}

export const useViewerStore = create<ViewerStore>((set) => ({
  viewer: null,
  setViewer: (viewer) => set({ viewer }),
}))
