import {
  Viewer,
  Ion,
  EllipsoidTerrainProvider,
  UrlTemplateImageryProvider,
  Credit,
  type ImageryLayer,
} from 'cesium'

const ION_PLACEHOLDER = 'your_cesium_ion_token_here'

export type EarthViewer = {
  viewer: Viewer
  basemapLayer: ImageryLayer
}

/** Treat empty or placeholder Ion tokens as unset. */
export function isValidIonToken(token?: string): boolean {
  if (!token) return false
  const trimmed = token.trim()
  return trimmed.length > 0 && trimmed !== ION_PLACEHOLDER
}

/** Free global imagery — no Cesium Ion token required. */
export function createFallbackBasemapProvider(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    credit: new Credit(
      'Tiles © Esri — Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, IGP',
    ),
    maximumLevel: 19,
  })
}

export function createViewer(container: HTMLElement): EarthViewer {
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN
  const useIon = isValidIonToken(token)
  if (useIon) {
    Ion.defaultAccessToken = token!
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

  if (!useIon) {
    viewer.imageryLayers.removeAll()
    const basemapLayer = viewer.imageryLayers.addImageryProvider(
      createFallbackBasemapProvider(),
    )
    return { viewer, basemapLayer }
  }

  const basemapLayer = viewer.imageryLayers.get(0)
  basemapLayer.imageryProvider.errorEvent.addEventListener(() => {
    if (viewer.isDestroyed()) return
    console.warn('Cesium Ion basemap failed; falling back to Esri World Imagery.')
    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(createFallbackBasemapProvider())
  })

  return { viewer, basemapLayer: viewer.imageryLayers.get(0) }
}

export function setBasemapVisible(basemapLayer: ImageryLayer | null, visible: boolean): void {
  if (basemapLayer) {
    basemapLayer.show = visible
  }
}
