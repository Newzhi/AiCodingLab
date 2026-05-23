import { useEffect, useRef } from 'react'
import {
  Cartesian2,
  Cartographic,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium'
import { loadTemperatureGrid, probeTemperature } from '../services/gridSampler'
import { useCrosshairStore } from '../stores/crosshairStore'
import { useLayerStore } from '../stores/layerStore'

const PROBE_DEBOUNCE_MS = 300

export function useCrosshairProbe(viewer: Viewer | null) {
  const currentTime = useLayerStore((s) => s.currentTime)
  const setProbe = useCrosshairStore((s) => s.setProbe)
  const reset = useCrosshairStore((s) => s.reset)
  const liveWebWeather = useCrosshairStore((s) => s.liveWebWeather)
  const multiSourceMode = useCrosshairStore((s) => s.multiSourceMode)
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
        heightM: carto.height,
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

      if (probeTimer.current !== null) window.clearTimeout(probeTimer.current)
      const gen = ++probeGen.current
      probeTimer.current = window.setTimeout(() => {
        void probeTemperature(ll.lat, ll.lon, currentTime, gridRef.current, {
          preferWeb: liveWebWeather,
          multiSource: multiSourceMode,
        }).then((result) => {
          if (gen !== probeGen.current) return
          if (multiSourceMode && result.sources) {
            setProbe({
              tempC: result.consensusTempC ?? result.tempC,
              consensusTempC: result.consensusTempC ?? result.tempC,
              confidence: result.confidence ?? 'low',
              sources: result.sources,
              primaryUsed: result.primaryUsed ?? result.source,
              source: result.primaryUsed ?? result.source,
            })
          } else {
            setProbe({
              tempC: result.tempC,
              source: result.source,
              consensusTempC: result.tempC,
              confidence: 'medium',
              sources: [],
              primaryUsed: result.source,
            })
          }
        })
      }, PROBE_DEBOUNCE_MS)
    }, ScreenSpaceEventType.MOUSE_MOVE)

    const onLeave = () => reset()
    canvas.addEventListener('mouseleave', onLeave)

    return () => {
      if (probeTimer.current !== null) window.clearTimeout(probeTimer.current)
      canvas.removeEventListener('mouseleave', onLeave)
      handler.destroy()
      reset()
    }
  }, [
    viewer,
    currentTime,
    liveWebWeather,
    multiSourceMode,
    setProbe,
    reset,
  ])
}
