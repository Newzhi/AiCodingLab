import { useEffect, useRef } from 'react'
import {
  Cartesian2,
  Cartographic,
  Ellipsoid,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium'
import { fetchRegionWeather } from '../api/client'
import {
  applyRegionalViewLayer,
  highlightRegion,
  removeRegionalViewLayer,
} from '../layers/regionalViewLayer'
import { useCrosshairStore, type Confidence } from '../stores/crosshairStore'
import { useLayerStore } from '../stores/layerStore'

const REGION_DEBOUNCE_MS = 100

export function useRegionalView(viewer: Viewer | null) {
  const regionalView = useLayerStore((s) => s.layers.regional_view)
  const currentTime = useLayerStore((s) => s.currentTime)
  const setProbe = useCrosshairStore((s) => s.setProbe)
  const reset = useCrosshairStore((s) => s.reset)
  const loadGen = useRef(0)
  const regionTimer = useRef<number | null>(null)
  const regionGen = useRef(0)

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return

    const gen = ++loadGen.current
    let cancelled = false

    async function sync() {
      if (!regionalView) {
        removeRegionalViewLayer(viewer!)
        highlightRegion(null)
        setProbe({ useRegionalHud: false })
        return
      }
      try {
        await applyRegionalViewLayer(viewer!)
        if (!cancelled && gen === loadGen.current) {
          setProbe({ useRegionalHud: true })
        }
      } catch (err) {
        console.error('Regional view load failed', err)
        if (!cancelled) setProbe({ useRegionalHud: false })
      }
    }

    void sync()
    return () => {
      cancelled = true
      if (!regionalView) removeRegionalViewLayer(viewer)
    }
  }, [viewer, regionalView, setProbe])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !regionalView) return

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
    const canvas = viewer.scene.canvas

    const pickLatLon = (position: Cartesian2) => {
      let cartesian = viewer.camera.pickEllipsoid(position, Ellipsoid.WGS84)
      if (!cartesian) return null
      const ray = viewer.camera.getPickRay(position)
      if (ray && viewer.scene.globe.show) {
        const globeHit = viewer.scene.globe.pick(ray, viewer.scene)
        if (globeHit) cartesian = globeHit
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
        highlightRegion(null)
        return
      }

      setProbe({
        active: true,
        screenX: rect.left + movement.endPosition.x,
        screenY: rect.top + movement.endPosition.y,
        lat: ll.lat,
        lon: ll.lon,
        useRegionalHud: true,
      })

      if (regionTimer.current !== null) window.clearTimeout(regionTimer.current)
      const gen = ++regionGen.current
      regionTimer.current = window.setTimeout(() => {
        void fetchRegionWeather(ll.lat, ll.lon, currentTime).then((region) => {
          if (gen !== regionGen.current) return
          highlightRegion(region.region_id)
          const confidence = (region.confidence ?? 'low') as Confidence
          setProbe({
            regionId: region.region_id,
            regionName: region.name,
            regionNameZh: region.name_zh,
            regionTempC: region.temp_c,
            regionSource: region.source ?? 'grid',
            regionAdminLevel: region.admin_level,
            tempC: region.temp_c,
            source: region.source ?? 'grid',
            confidence,
            useRegionalHud: true,
          })
        })
      }, REGION_DEBOUNCE_MS)
    }, ScreenSpaceEventType.MOUSE_MOVE)

    const onLeave = () => {
      highlightRegion(null)
      reset()
    }
    canvas.addEventListener('mouseleave', onLeave)

    return () => {
      if (regionTimer.current !== null) window.clearTimeout(regionTimer.current)
      canvas.removeEventListener('mouseleave', onLeave)
      handler.destroy()
      highlightRegion(null)
    }
  }, [viewer, regionalView, currentTime, setProbe, reset])
}
