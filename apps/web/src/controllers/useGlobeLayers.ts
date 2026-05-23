import { useEffect, useRef } from 'react'
import type { ImageryLayer, Viewer } from 'cesium'
import { Color } from 'cesium'
import { setBasemapVisible } from '../cesium/createViewer'
import { useLayerStore } from '../stores/layerStore'
import { useLayerErrorStore } from '../stores/layerErrorStore'
import {
  applyTemperatureLayer,
  removeTemperatureLayer,
} from '../layers/temperatureLayer'
import {
  applyTerrainContoursLayer,
  removeTerrainContoursLayer,
} from '../layers/terrainContoursLayer'
import { GpuUvParticleLayer } from '../layers/uvParticleLayer'
import type { LayerId } from '../stores/layerStore'

const windLayer = new GpuUvParticleLayer(Color.CYAN.withAlpha(0.85))
const oceanLayer = new GpuUvParticleLayer(Color.DEEPSKYBLUE.withAlpha(0.9))

function layerErrorMessage(err: unknown, layerId: string): string {
  if (err instanceof Error) return `${layerId}: ${err.message}`
  return `${layerId}: 图层加载失败`
}

export function useGlobeLayers(
  viewer: Viewer | null,
  basemapLayer: ImageryLayer | null,
) {
  const layers = useLayerStore((s) => s.layers)
  const currentTime = useLayerStore((s) => s.currentTime)
  const setTempRange = useLayerStore((s) => s.setTempRange)
  const setError = useLayerErrorStore((s) => s.setError)
  const clearError = useLayerErrorStore((s) => s.clearError)
  const syncGen = useRef(0)

  useEffect(() => {
    setBasemapVisible(basemapLayer, layers.basemap)
    if (layers.basemap) clearError('basemap')
  }, [layers.basemap, basemapLayer, clearError])

  useEffect(() => {
    if (!viewer || !currentTime) return

    const gen = ++syncGen.current
    let cancelled = false

    async function syncLayer(id: LayerId, fn: () => Promise<void>) {
      try {
        await fn()
        if (!cancelled && gen === syncGen.current) clearError(id)
      } catch (err) {
        console.error(`Layer sync failed (${id})`, err)
        if (!cancelled && gen === syncGen.current) {
          setError(id, layerErrorMessage(err, id))
        }
      }
    }

    async function syncAll() {
      if (layers.temperature) {
        await syncLayer('temperature', async () => {
          const range = await applyTemperatureLayer(viewer!, currentTime!)
          if (!cancelled && gen === syncGen.current) setTempRange(range)
        })
      } else {
        removeTemperatureLayer(viewer!)
        if (!cancelled && gen === syncGen.current) {
          setTempRange(null)
          clearError('temperature')
        }
      }

      if (layers.terrain_contours) {
        await syncLayer('terrain_contours', () =>
          applyTerrainContoursLayer(viewer!, currentTime!),
        )
      } else {
        await removeTerrainContoursLayer(viewer!)
        clearError('terrain_contours')
      }

      if (layers.wind) {
        await syncLayer('wind', async () => {
          await windLayer.load(viewer!, currentTime!, 'wind')
          viewer!.scene.requestRender()
        })
      } else {
        windLayer.destroy(viewer!)
        clearError('wind')
      }

      if (layers.ocean) {
        await syncLayer('ocean', async () => {
          await oceanLayer.load(viewer!, currentTime!, 'ocean')
          viewer!.scene.requestRender()
        })
      } else {
        oceanLayer.destroy(viewer!)
        clearError('ocean')
      }
    }

    void syncAll()
    return () => {
      cancelled = true
    }
  }, [viewer, layers, currentTime, setTempRange, setError, clearError])
}

export function destroyGlobeLayers(viewer: Viewer): void {
  windLayer.destroy(viewer)
  oceanLayer.destroy(viewer)
}
