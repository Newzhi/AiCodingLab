import type { CSSProperties } from 'react'
import { useCrosshairStore } from '../stores/crosshairStore'

function formatCoord(value: number | null, posSuffix: string, negSuffix: string): string {
  if (value === null) return '—'
  const abs = Math.abs(value).toFixed(4)
  return `${abs}°${value >= 0 ? posSuffix : negSuffix}`
}

export function CrosshairOverlay() {
  const active = useCrosshairStore((s) => s.active)
  const screenX = useCrosshairStore((s) => s.screenX)
  const screenY = useCrosshairStore((s) => s.screenY)
  const lat = useCrosshairStore((s) => s.lat)
  const lon = useCrosshairStore((s) => s.lon)

  if (!active) return null

  return (
    <>
      <div
        className="crosshair-viewport"
        style={
          {
            '--crosshair-x': `${screenX}px`,
            '--crosshair-y': `${screenY}px`,
          } as CSSProperties
        }
        aria-hidden
      >
        <span className="crosshair-line crosshair-line-h" />
        <span className="crosshair-line crosshair-line-v" />
        <span className="crosshair-center-dot" />
      </div>
      <div
        className="crosshair-hud"
        style={{ left: screenX + 18, top: screenY + 18 }}
        role="status"
        aria-live="polite"
      >
        <div className="crosshair-hud-row crosshair-hud-coords">
          {formatCoord(lat, 'N', 'S')}, {formatCoord(lon, 'E', 'W')}
        </div>
      </div>
    </>
  )
}
