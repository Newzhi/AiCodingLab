import {
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  GeoJsonDataSource,
  JulianDate,
  type Entity,
  type Viewer,
} from 'cesium'
import {
  fetchChinaProvincesGeoJson,
  fetchCountriesGeoJson,
  type GeoFeatureCollection,
} from '../api/client'

let dataSource: GeoJsonDataSource | null = null
let entityByRegionId = new Map<string, Entity>()

const STYLE_DIM = {
  fill: Color.CYAN.withAlpha(0.1),
  outline: Color.CYAN.withAlpha(0.55),
  outlineWidth: 1.5,
}

const STYLE_HIGHLIGHT = {
  fill: Color.YELLOW.withAlpha(0.28),
  outline: Color.YELLOW,
  outlineWidth: 3,
}

function propString(entity: Entity, key: string): string | null {
  if (!entity.properties) return null
  const prop = entity.properties[key]
  if (!prop || typeof prop.getValue !== 'function') return null
  const v = prop.getValue(JulianDate.now())
  return typeof v === 'string' ? v : null
}

function regionIdFromEntity(entity: Entity): string | null {
  return (
    propString(entity, 'id') ??
    propString(entity, 'ISO_A3') ??
    propString(entity, 'name')
  )
}

function applyEntityStyle(entity: Entity, highlight: boolean): void {
  const style = highlight ? STYLE_HIGHLIGHT : STYLE_DIM
  if (entity.polygon) {
    entity.polygon.material = new ColorMaterialProperty(style.fill)
    entity.polygon.outlineColor = new ConstantProperty(style.outline)
    entity.polygon.outlineWidth = new ConstantProperty(style.outlineWidth)
  }
  if (entity.polyline) {
    entity.polyline.material = new ColorMaterialProperty(style.outline)
    entity.polyline.width = new ConstantProperty(style.outlineWidth)
  }
}

function isDataSourceOnViewer(viewer: Viewer): boolean {
  return dataSource !== null && viewer.dataSources.contains(dataSource)
}

export async function applyRegionalViewLayer(viewer: Viewer): Promise<void> {
  if (isDataSourceOnViewer(viewer)) return
  if (dataSource) {
    dataSource = null
    entityByRegionId = new Map()
  }

  const [countries, provinces] = await Promise.all([
    fetchCountriesGeoJson(),
    fetchChinaProvincesGeoJson(),
  ])

  const collection: GeoFeatureCollection = {
    type: 'FeatureCollection',
    features: [...countries.features, ...provinces.features],
  }

  dataSource = await GeoJsonDataSource.load(collection, {
    clampToGround: true,
  })
  await viewer.dataSources.add(dataSource)

  entityByRegionId = new Map()
  for (const entity of dataSource.entities.values) {
    const rid = regionIdFromEntity(entity)
    if (rid) entityByRegionId.set(rid, entity)
    applyEntityStyle(entity, false)
  }
}

export function highlightRegion(regionId: string | null): void {
  for (const [id, entity] of entityByRegionId) {
    applyEntityStyle(entity, regionId !== null && id === regionId)
  }
}

export function removeRegionalViewLayer(viewer: Viewer): void {
  if (!dataSource) return
  try {
    if (!viewer.isDestroyed() && viewer.dataSources.contains(dataSource)) {
      viewer.dataSources.remove(dataSource, true)
    }
  } catch (err) {
    console.warn('removeRegionalViewLayer', err)
  } finally {
    dataSource = null
    entityByRegionId = new Map()
  }
}
