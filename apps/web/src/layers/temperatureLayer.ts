import {
  Viewer,
  SingleTileImageryProvider,
  Rectangle,
  ImageryLayer,
} from 'cesium'
import { assetUrl, fetchAssets } from '../api/client'

let imageryLayer: ImageryLayer | null = null

export async function applyTemperatureLayer(
  viewer: Viewer,
  validTime: string,
): Promise<{ min: number; max: number } | null> {
  removeTemperatureLayer(viewer)
  const assets = await fetchAssets(validTime, 'temperature')
  const textureUrl = assetUrl(assets.files.texture)
  const metaUrl = assetUrl(assets.files.meta)

  const metaRes = await fetch(metaUrl)
  if (!metaRes.ok) {
    throw new Error(`气温元数据加载失败 (${metaRes.status})`)
  }
  const meta = await metaRes.json()
  const [west, south, east, north] = meta.bounds as number[]

  const provider = await SingleTileImageryProvider.fromUrl(textureUrl, {
    rectangle: Rectangle.fromDegrees(west, south, east, north),
  })

  // Keep basemap at index 0; weather overlay above it.
  imageryLayer = viewer.imageryLayers.addImageryProvider(provider)
  viewer.imageryLayers.raiseToTop(imageryLayer)
  imageryLayer.alpha = 0.82
  imageryLayer.show = true
  viewer.scene.requestRender()
  return {
    min: meta.color_scale_min_c ?? meta.min_c,
    max: meta.color_scale_max_c ?? meta.max_c,
  }
}

export function removeTemperatureLayer(viewer: Viewer): void {
  if (!imageryLayer) return
  try {
    if (!viewer.isDestroyed() && viewer.imageryLayers.contains(imageryLayer)) {
      viewer.imageryLayers.remove(imageryLayer, true)
    }
  } catch (err) {
    console.warn('removeTemperatureLayer', err)
  } finally {
    imageryLayer = null
  }
}
