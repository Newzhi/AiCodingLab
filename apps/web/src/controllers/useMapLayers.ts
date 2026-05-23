import { useEffect, useRef } from 'react'
import type { ImageryLayer, Viewer } from 'cesium'
import {
  EllipsoidTerrainProvider,
  createWorldTerrainAsync,
} from 'cesium'
import { isValidIonToken, setBasemapVisible } from '../cesium/createViewer'
import {
  createHillshadeProvider,
  createRoadsOverlayProvider,
} from '../cesium/basemapProviders'
import { useLayerStore } from '../stores/layerStore'
import { useLayerErrorStore } from '../stores/layerErrorStore'

const ROADS_OVERLAY_ALPHA = 0.42
const HILLSHADE_ALPHA = 0.55

export function useMapLayers(
  viewer: Viewer | null,
  basemapLayer: ImageryLayer | null,
) {
  const layers = useLayerStore((s) => s.layers)
  const setError = useLayerErrorStore((s) => s.setError)
  const clearError = useLayerErrorStore((s) => s.clearError)
  const hillshadeRef = useRef<ImageryLayer | null>(null)
  const roadsRef = useRef<ImageryLayer | null>(null)
  const terrainGen = useRef(0)

  useEffect(() => {
    setBasemapVisible(basemapLayer, layers.basemap)
    if (layers.basemap) clearError('basemap')
  }, [layers.basemap, basemapLayer, clearError])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    const gen = ++terrainGen.current
    let cancelled = false

    async function applyTerrain() {
      try {
        if (layers.terrain && isValidIonToken(import.meta.env.VITE_CESIUM_ION_TOKEN)) {
          const provider = await createWorldTerrainAsync()
          if (cancelled || gen !== terrainGen.current || viewer.isDestroyed()) return
          viewer.terrainProvider = provider
          if (!cancelled) clearError('terrain')
        } else {
          viewer.terrainProvider = new EllipsoidTerrainProvider()
          if (!layers.terrain) {
            clearError('terrain')
          } else if (!cancelled) {
            setError(
              'terrain',
              '高程地形需要有效的 VITE_CESIUM_ION_TOKEN（Cesium World Terrain）',
            )
          }
        }
        viewer.scene.requestRender()
      } catch (err) {
        if (!cancelled) {
          setError('terrain', err instanceof Error ? err.message : '地形加载失败')
        }
      }
    }

    void applyTerrain()
    return () => {
      cancelled = true
    }
  }, [viewer, layers.terrain, setError, clearError])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    if (layers.hillshade) {
      if (!hillshadeRef.current) {
        const layer = viewer.imageryLayers.addImageryProvider(createHillshadeProvider())
        layer.alpha = HILLSHADE_ALPHA
        hillshadeRef.current = layer
      }
      hillshadeRef.current.show = true
      clearError('hillshade')
    } else if (hillshadeRef.current) {
      hillshadeRef.current.show = false
      clearError('hillshade')
    }
    viewer.scene.requestRender()
  }, [viewer, layers.hillshade, clearError])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    if (layers.roads) {
      try {
        if (!roadsRef.current) {
          const layer = viewer.imageryLayers.addImageryProvider(createRoadsOverlayProvider())
          layer.alpha = ROADS_OVERLAY_ALPHA
          roadsRef.current = layer
        }
        roadsRef.current.show = true
        clearError('roads')
      } catch (err) {
        setError('roads', err instanceof Error ? err.message : '路网图层加载失败')
      }
    } else if (roadsRef.current) {
      roadsRef.current.show = false
      clearError('roads')
    }
    viewer.scene.requestRender()
  }, [viewer, layers.roads, setError, clearError])

  useEffect(() => {
    return () => {
      if (!viewer || viewer.isDestroyed()) return
      if (hillshadeRef.current) {
        viewer.imageryLayers.remove(hillshadeRef.current, false)
        hillshadeRef.current = null
      }
      if (roadsRef.current) {
        viewer.imageryLayers.remove(roadsRef.current, false)
        roadsRef.current = null
      }
    }
  }, [viewer])
}
