import { useEffect } from 'react'
import {
  Cartesian2,
  Cartographic,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium'
import { useCrosshairStore } from '../stores/crosshairStore'

export function useCrosshairProbe(viewer: Viewer | null) {
  const setProbe = useCrosshairStore((s) => s.setProbe)
  const reset = useCrosshairStore((s) => s.reset)

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    const canvas = viewer.scene.canvas

    const pickLatLon = (position: Cartesian2) => {
      const scene = viewer.scene
      let cartesian = viewer.camera.pickEllipsoid(position, Ellipsoid.WGS84)
      if (!cartesian) return null

      const ray = viewer.camera.getPickRay(position)
      if (ray && scene.globe.show) {
        const globeHit = scene.globe.pick(ray, scene)
        if (globeHit) cartesian = globeHit
      }

      if (scene.pickPositionSupported) {
        const terrainHit = scene.pickPosition(position)
        if (terrainHit) cartesian = terrainHit
      }

      const carto = Cartographic.fromCartesian(cartesian)
      return {
        lat: (carto.latitude * 180) / Math.PI,
        lon: (carto.longitude * 180) / Math.PI,
      }
    }

    handler.setInputAction((movement: { endPosition: Cartesian2 }) => {
      const rect = canvas.getBoundingClientRect()
      const ll = pickLatLon(movement.endPosition)
      if (!ll) {
        reset()
        return
      }

      setProbe({
        active: true,
        screenX: rect.left + movement.endPosition.x,
        screenY: rect.top + movement.endPosition.y,
        lat: ll.lat,
        lon: ll.lon,
      })
    }, ScreenSpaceEventType.MOUSE_MOVE)

    const onLeave = () => reset()
    canvas.addEventListener('mouseleave', onLeave)

    return () => {
      canvas.removeEventListener('mouseleave', onLeave)
      handler.destroy()
      reset()
    }
  }, [viewer, setProbe, reset])
}
