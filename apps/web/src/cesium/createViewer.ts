import {
  Viewer,
  Ion,
  EllipsoidTerrainProvider,
  UrlTemplateImageryProvider,
  Credit,
} from 'cesium'

export function createViewer(container: HTMLElement): Viewer {
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN
  if (token) {
    Ion.defaultAccessToken = token
  }

  const viewer = new Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: true,
    sceneModePicker: true,
    navigationHelpButton: false,
    fullscreenButton: true,
    terrainProvider: new EllipsoidTerrainProvider(),
  })

  if (!token) {
    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(
      new UrlTemplateImageryProvider({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        credit: new Credit('© OpenStreetMap contributors'),
      }),
    )
  }

  return viewer
}
