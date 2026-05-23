import {
  Viewer,
  Ion,
  EllipsoidTerrainProvider,
  SceneMode,
  type ImageryLayer,
} from 'cesium'
import { createOsmBasemapProvider } from './basemapProviders'

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

  viewer.scene.mode = SceneMode.SCENE3D
  viewer.scene.preRender.addEventListener(() => {
    if (viewer.isDestroyed()) return
    if (viewer.scene.mode !== SceneMode.SCENE3D) {
      viewer.scene.mode = SceneMode.SCENE3D
    }
  })

  viewer.imageryLayers.removeAll()
  const basemapLayer = viewer.imageryLayers.addImageryProvider(createOsmBasemapProvider())

  return { viewer, basemapLayer }
}

export function setBasemapVisible(basemapLayer: ImageryLayer | null, visible: boolean): void {
  if (basemapLayer) {
    basemapLayer.show = visible
  }
}
