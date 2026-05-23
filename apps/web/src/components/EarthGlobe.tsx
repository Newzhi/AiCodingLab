import { useEffect, useRef } from 'react'
import type { Viewer } from 'cesium'
import { Color } from 'cesium'
import { createViewer } from '../cesium/createViewer'
import { useLayerStore } from '../stores/layerStore'
import {
  applyTemperatureLayer,
  removeTemperatureLayer,
} from '../layers/temperatureLayer'
import { applyIsobarsLayer, removeIsobarsLayer } from '../layers/isobarsLayer'
import { GpuUvParticleLayer } from '../layers/uvParticleLayer'

const windLayer = new GpuUvParticleLayer(Color.CYAN.withAlpha(0.85))
const oceanLayer = new GpuUvParticleLayer(Color.DEEPSKYBLUE.withAlpha(0.9))

export function EarthGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const layers = useLayerStore((s) => s.layers)
  const currentTime = useLayerStore((s) => s.currentTime)
  const setTempRange = useLayerStore((s) => s.setTempRange)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return
    viewerRef.current = createViewer(containerRef.current)
    return () => {
      windLayer.destroy(viewerRef.current!)
      oceanLayer.destroy(viewerRef.current!)
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    const time = currentTime
    if (!viewer || !time) return

    let cancelled = false

    async function sync() {
      try {
        if (layers.temperature) {
          const range = await applyTemperatureLayer(viewer, time)
          if (!cancelled) setTempRange(range)
        } else {
          removeTemperatureLayer(viewer)
          if (!cancelled) setTempRange(null)
        }

        if (layers.isobars) {
          await applyIsobarsLayer(viewer, time)
        } else {
          await removeIsobarsLayer(viewer)
        }

        if (layers.wind) {
          await windLayer.load(viewer, time, 'wind')
        } else {
          windLayer.destroy(viewer)
        }

        if (layers.ocean) {
          await oceanLayer.load(viewer, time, 'ocean')
        } else {
          oceanLayer.destroy(viewer)
        }
      } catch (err) {
        console.error('Layer sync failed', err)
      }
    }

    void sync()
    return () => {
      cancelled = true
    }
  }, [layers, currentTime, setTempRange])

  return <div ref={containerRef} className="cesium-container" />
}
