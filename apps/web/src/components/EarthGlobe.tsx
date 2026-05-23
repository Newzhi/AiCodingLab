import { useEffect, useRef, useState } from 'react'
import type { ImageryLayer, Viewer } from 'cesium'
import { createViewer } from '../cesium/createViewer'
import { useCrosshairProbe } from '../controllers/useCrosshairProbe'
import { useMapLayers } from '../controllers/useMapLayers'
import { useViewerStore } from '../stores/viewerStore'
import { LayerErrorBanner } from './LayerErrorBanner'

export function EarthGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewer, setViewerState] = useState<Viewer | null>(null)
  const [basemapLayer, setBasemapLayer] = useState<ImageryLayer | null>(null)
  const setViewer = useViewerStore((s) => s.setViewer)

  useMapLayers(viewer, basemapLayer)
  useCrosshairProbe(viewer)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // StrictMode remount: clear stale Cesium DOM before creating a new Viewer.
    container.replaceChildren()

    let created: ReturnType<typeof createViewer>
    try {
      created = createViewer(container)
    } catch (err) {
      console.error('Failed to create Cesium Viewer', err)
      return
    }

    setViewerState(created.viewer)
    setBasemapLayer(created.basemapLayer)
    setViewer(created.viewer)

    return () => {
      if (!created.viewer.isDestroyed()) {
        created.viewer.destroy()
      }
      setViewerState(null)
      setBasemapLayer(null)
      setViewer(null)
      container.replaceChildren()
    }
  }, [setViewer])

  return (
    <>
      <div ref={containerRef} className="cesium-container" />
      <LayerErrorBanner />
    </>
  )
}
