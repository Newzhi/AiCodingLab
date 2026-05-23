import { useEffect, useRef, useState } from 'react'
import type { ImageryLayer, Viewer } from 'cesium'
import { createViewer } from '../cesium/createViewer'
import { useCrosshairProbe } from '../controllers/useCrosshairProbe'
import { destroyGlobeLayers, useGlobeLayers } from '../controllers/useGlobeLayers'
import { useRegionalView } from '../controllers/useRegionalView'
import { removeTemperatureLayer } from '../layers/temperatureLayer'
import { removeRegionalViewLayer } from '../layers/regionalViewLayer'
import { useViewerStore } from '../stores/viewerStore'
import { LayerErrorBanner } from './LayerErrorBanner'

export function EarthGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewer, setViewerState] = useState<Viewer | null>(null)
  const [basemapLayer, setBasemapLayer] = useState<ImageryLayer | null>(null)
  const setViewer = useViewerStore((s) => s.setViewer)

  useGlobeLayers(viewer, basemapLayer)
  useRegionalView(viewer)
  useCrosshairProbe(viewer)

  useEffect(() => {
    if (!containerRef.current) return
    const created = createViewer(containerRef.current)
    setViewerState(created.viewer)
    setBasemapLayer(created.basemapLayer)
    setViewer(created.viewer)
    return () => {
      destroyGlobeLayers(created.viewer)
      removeTemperatureLayer(created.viewer)
      removeRegionalViewLayer(created.viewer)
      created.viewer.destroy()
      setViewerState(null)
      setBasemapLayer(null)
      setViewer(null)
    }
  }, [setViewer])

  return (
    <>
      <div ref={containerRef} className="cesium-container" />
      <LayerErrorBanner />
    </>
  )
}
