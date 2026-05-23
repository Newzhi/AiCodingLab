import { Viewer, GeoJsonDataSource, Color } from 'cesium'
import { assetUrl, fetchAssets } from '../api/client'

let dataSource: GeoJsonDataSource | null = null

export async function applyTerrainContoursLayer(
  viewer: Viewer,
  validTime: string,
): Promise<void> {
  await removeTerrainContoursLayer(viewer)
  const assets = await fetchAssets(validTime, 'terrain_contours')
  const url = assetUrl(assets.files.geojson)
  dataSource = await GeoJsonDataSource.load(url, {
    stroke: Color.fromCssColorString('#d4a574').withAlpha(0.92),
    strokeWidth: 1.5,
    clampToGround: true,
  })
  await viewer.dataSources.add(dataSource)
}

export async function removeTerrainContoursLayer(viewer: Viewer): Promise<void> {
  if (dataSource) {
    await viewer.dataSources.remove(dataSource, true)
    dataSource = null
  }
}
