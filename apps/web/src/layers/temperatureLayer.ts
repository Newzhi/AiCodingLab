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
  const meta = await metaRes.json()
  const [west, south, east, north] = meta.bounds as number[]

  const provider = await SingleTileImageryProvider.fromUrl(textureUrl, {
    rectangle: Rectangle.fromDegrees(west, south, east, north),
  })
  // Keep basemap at index 0; weather overlay above it.
  imageryLayer = viewer.imageryLayers.addImageryProvider(
    provider,
    Math.min(viewer.imageryLayers.length, 1),
  )
  imageryLayer.alpha = 0.75
  return { min: meta.min_c, max: meta.max_c }
}

export function removeTemperatureLayer(viewer: Viewer): void {
  if (imageryLayer) {
    viewer.imageryLayers.remove(imageryLayer, true)
    imageryLayer = null
  }
}
