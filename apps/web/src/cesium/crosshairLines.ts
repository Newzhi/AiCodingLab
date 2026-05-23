import {
  Cartesian3,
  Color,
  PolylineCollection,
  type Viewer,
} from 'cesium'

const DEG_SPAN = 0.35
let collection: PolylineCollection | null = null

export function attachGlobeCrosshair(viewer: Viewer): void {
  detachGlobeCrosshair(viewer)
  collection = new PolylineCollection()
  viewer.scene.primitives.add(collection)

  const color = Color.fromCssColorString('#7dd3fc').withAlpha(0.55)
  collection.add({
    width: 1.2,
    color,
    positions: [Cartesian3.ZERO, Cartesian3.ZERO],
  })
  collection.add({
    width: 1.2,
    color,
    positions: [Cartesian3.ZERO, Cartesian3.ZERO],
  })
}

export function updateGlobeCrosshair(viewer: Viewer, lat: number, lon: number): void {
  if (!collection || collection.length < 2) return

  const hLine = collection.get(0)
  const vLine = collection.get(1)

  hLine.positions = Cartesian3.fromDegreesArray([
    lon - DEG_SPAN,
    lat,
    lon + DEG_SPAN,
    lat,
  ])
  vLine.positions = Cartesian3.fromDegreesArray([
    lon,
    lat - DEG_SPAN,
    lon,
    lat + DEG_SPAN,
  ])
  viewer.scene.requestRender()
}

export function detachGlobeCrosshair(viewer: Viewer): void {
  if (collection) {
    viewer.scene.primitives.remove(collection)
    collection = null
  }
}
