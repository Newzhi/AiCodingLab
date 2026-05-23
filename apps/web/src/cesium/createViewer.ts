import {
  Viewer,
  Ion,
  EllipsoidTerrainProvider,
  SceneMode,
  Cartesian3,
  Color,
  type ImageryLayer,
} from 'cesium'
import {
  createEsriFallbackBasemapProvider,
  createOsmBasemapProvider,
} from './basemapProviders'

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

function addBasemapLayers(viewer: Viewer): ImageryLayer {
  viewer.imageryLayers.removeAll()

  // Always keep a satellite fallback underneath so the globe is never blank.
  try {
    viewer.imageryLayers.addImageryProvider(createEsriFallbackBasemapProvider())
  } catch (err) {
    console.warn('Esri fallback basemap failed to initialize.', err)
  }

  try {
    const basemapLayer = viewer.imageryLayers.addImageryProvider(createOsmBasemapProvider())
    basemapLayer.imageryProvider.errorEvent.addEventListener(() => {
      if (viewer.isDestroyed()) return
      console.warn('OSM basemap tile error; showing Esri fallback underneath.')
      basemapLayer.show = false
      viewer.scene.requestRender()
    })
    return basemapLayer
  } catch (err) {
    console.warn('OSM basemap failed to initialize; using Esri fallback only.', err)
    const fallbackLayer = viewer.imageryLayers.get(0)
    if (fallbackLayer) return fallbackLayer
    return viewer.imageryLayers.addImageryProvider(createEsriFallbackBasemapProvider())
  }
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
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: true,
    terrainProvider: new EllipsoidTerrainProvider(),
    baseLayer: false,
  })

  viewer.useDefaultRenderLoop = true
  viewer.scene.mode = SceneMode.SCENE3D
  viewer.scene.globe.show = true
  viewer.scene.globe.baseColor = Color.fromCssColorString('#1a3a5c')
  viewer.scene.backgroundColor = Color.BLACK
  viewer.scene.skyAtmosphere.show = true
  if (viewer.scene.skyBox) {
    viewer.scene.skyBox.show = true
  }

  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(105, 20, 25_000_000),
  })

  viewer.scene.preRender.addEventListener(() => {
    if (viewer.isDestroyed()) return
    if (viewer.scene.mode !== SceneMode.SCENE3D) {
      viewer.scene.mode = SceneMode.SCENE3D
    }
  })

  const basemapLayer = addBasemapLayers(viewer)
  viewer.scene.requestRender()

  return { viewer, basemapLayer }
}

export function setBasemapVisible(basemapLayer: ImageryLayer | null, visible: boolean): void {
  if (basemapLayer) {
    basemapLayer.show = visible
  }
}
