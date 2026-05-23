import { useEffect, useRef } from 'react'
import {
  Cartesian2,
  Cartographic,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium'
import {
  attachGlobeCrosshair,
  detachGlobeCrosshair,
  updateGlobeCrosshair,
} from '../cesium/crosshairLines'
import { loadTemperatureGrid, probeTemperature } from '../services/gridSampler'
import { useCrosshairStore } from '../stores/crosshairStore'
import { useLayerStore } from '../stores/layerStore'

const PROBE_DEBOUNCE_MS = 80

export function useCrosshairProbe(viewer: Viewer | null) {
  const currentTime = useLayerStore((s) => s.currentTime)
  const setProbe = useCrosshairStore((s) => s.setProbe)
  const reset = useCrosshairStore((s) => s.reset)
  const gridRef = useRef<Awaited<ReturnType<typeof loadTemperatureGrid>>>(null)
  const probeTimer = useRef<number | null>(null)
  const probeGen = useRef(0)

  useEffect(() => {
    if (!currentTime) {
      gridRef.current = null
      return
    }
    let cancelled = false
    void loadTemperatureGrid(currentTime).then((grid) => {
      if (!cancelled) gridRef.current = grid
    })
    return () => {
      cancelled = true
    }
  }, [currentTime])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    attachGlobeCrosshair(viewer)
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    const canvas = viewer.scene.canvas

    const pickLatLon = (position: Cartesian2) => {
      const ray = viewer.camera.getPickRay(position)
      if (!ray) return null
      const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
      const hit =
        cartesian ?? viewer.camera.pickEllipsoid(position, Ellipsoid.WGS84)
      if (!hit) return null
      const carto = Cartographic.fromCartesian(hit)
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

      updateGlobeCrosshair(viewer, ll.lat, ll.lon)
      setProbe({
        active: true,
        screenX: rect.left + movement.endPosition.x,
        screenY: rect.top + movement.endPosition.y,
        lat: ll.lat,
        lon: ll.lon,
      })

      if (probeTimer.current !== null) window.clearTimeout(probeTimer.current)
      const gen = ++probeGen.current
      probeTimer.current = window.setTimeout(() => {
        void probeTemperature(ll.lat, ll.lon, currentTime, gridRef.current).then(
          ({ tempC, source }) => {
            if (gen === probeGen.current) setProbe({ tempC, source })
          },
        )
      }, PROBE_DEBOUNCE_MS)
    }, ScreenSpaceEventType.MOUSE_MOVE)

    const onLeave = () => reset()
    canvas.addEventListener('mouseleave', onLeave)

    return () => {
      if (probeTimer.current !== null) window.clearTimeout(probeTimer.current)
      canvas.removeEventListener('mouseleave', onLeave)
      handler.destroy()
      detachGlobeCrosshair(viewer)
      reset()
    }
  }, [viewer, currentTime, setProbe, reset])
}
