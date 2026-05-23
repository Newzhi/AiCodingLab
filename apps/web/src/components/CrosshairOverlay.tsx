import { useCrosshairStore } from '../stores/crosshairStore'

function formatCoord(value: number | null, posSuffix: string, negSuffix: string): string {
  if (value === null) return '—'
  const abs = Math.abs(value).toFixed(2)
  return `${abs}°${value >= 0 ? posSuffix : negSuffix}`
}

export function CrosshairOverlay() {
  const active = useCrosshairStore((s) => s.active)
  const screenX = useCrosshairStore((s) => s.screenX)
  const screenY = useCrosshairStore((s) => s.screenY)
  const lat = useCrosshairStore((s) => s.lat)
  const lon = useCrosshairStore((s) => s.lon)
  const tempC = useCrosshairStore((s) => s.tempC)
  const source = useCrosshairStore((s) => s.source)

  if (!active) return null

  const tempLabel = tempC === null ? '— °C' : `${tempC.toFixed(1)} °C`

  return (
    <>
      <div
        className="crosshair-lines"
        style={{ left: screenX, top: screenY }}
        aria-hidden
      >
        <span className="crosshair-h" />
        <span className="crosshair-v" />
      </div>
      <div
        className="crosshair-hud"
        style={{ left: screenX + 16, top: screenY + 16 }}
        role="status"
        aria-live="polite"
      >
        <div className="crosshair-hud-row">
          {formatCoord(lat, 'N', 'S')}, {formatCoord(lon, 'E', 'W')}
        </div>
        <div className="crosshair-hud-row crosshair-hud-temp">{tempLabel}</div>
        <div className="crosshair-hud-row crosshair-hud-source">source: {source}</div>
      </div>
    </>
  )
}
