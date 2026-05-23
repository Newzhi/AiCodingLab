import { useState } from 'react'
import {
  Cartesian3,
  Color,
  HeightReference,
  Math as CesiumMath,
} from 'cesium'
import { useViewerStore } from '../stores/viewerStore'

const MARKER_ID = 'fly-to-marker'
const DEFAULT_ALTITUDE_M = 1_500_000

function parseCoord(value: string, min: number, max: number): number | null {
  const n = Number.parseFloat(value.trim())
  if (!Number.isFinite(n) || n < min || n > max) return null
  return n
}

export function FlyToPanel() {
  const viewer = useViewerStore((s) => s.viewer)
  const [latInput, setLatInput] = useState('')
  const [lonInput, setLonInput] = useState('')
  const [altInput, setAltInput] = useState('1500')
  const [error, setError] = useState<string | null>(null)

  function handleFly() {
    if (!viewer) {
      setError('地球尚未加载')
      return
    }

    const lat = parseCoord(latInput, -90, 90)
    const lon = parseCoord(lonInput, -180, 180)
    if (lat === null) {
      setError('纬度须在 -90 至 90 之间')
      return
    }
    if (lon === null) {
      setError('经度须在 -180 至 180 之间')
      return
    }

    let altitudeM = DEFAULT_ALTITUDE_M
    const altKm = Number.parseFloat(altInput.trim())
    if (Number.isFinite(altKm) && altKm > 0) {
      altitudeM = CesiumMath.clamp(altKm * 1000, 500_000, 2_000_000)
    }

    setError(null)
    viewer.entities.removeById(MARKER_ID)
    viewer.entities.add({
      id: MARKER_ID,
      position: Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: 11,
        color: Color.fromCssColorString('#fbbf24'),
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    })

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lon, lat, altitudeM),
      duration: 2.0,
    })
  }

  return (
    <section className="fly-to-panel">
      <h3>定位</h3>
      <label className="fly-to-field">
        <span>纬度</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="-90 ~ 90"
          value={latInput}
          onChange={(e) => setLatInput(e.target.value)}
        />
      </label>
      <label className="fly-to-field">
        <span>经度</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="-180 ~ 180"
          value={lonInput}
          onChange={(e) => setLonInput(e.target.value)}
        />
      </label>
      <label className="fly-to-field">
        <span>高度 (km)</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="500 ~ 2000"
          value={altInput}
          onChange={(e) => setAltInput(e.target.value)}
        />
      </label>
      <button type="button" className="fly-to-btn" onClick={handleFly}>
        定位
      </button>
      {error && <p className="fly-to-error">{error}</p>}
    </section>
  )
}
