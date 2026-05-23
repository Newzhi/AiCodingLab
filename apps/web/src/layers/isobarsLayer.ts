import { Viewer, GeoJsonDataSource, Color } from 'cesium'
import { assetUrl, fetchAssets } from '../api/client'

let dataSource: GeoJsonDataSource | null = null

export async function applyIsobarsLayer(
  viewer: Viewer,
  validTime: string,
): Promise<void> {
  await removeIsobarsLayer(viewer)
  const assets = await fetchAssets(validTime, 'isobars')
  const url = assetUrl(assets.files.isobars)
  dataSource = await GeoJsonDataSource.load(url, {
    stroke: Color.WHITE.withAlpha(0.9),
    strokeWidth: 1.5,
    clampToGround: true,
  })
  await viewer.dataSources.add(dataSource)
}

export async function removeIsobarsLayer(viewer: Viewer): Promise<void> {
  if (dataSource) {
    await viewer.dataSources.remove(dataSource, true)
    dataSource = null
  }
}
