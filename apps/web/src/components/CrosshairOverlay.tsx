import type { CSSProperties } from 'react'
import { useCrosshairStore } from '../stores/crosshairStore'

const SOURCE_LABELS: Record<string, string> = {
  grid: '网格 GFS/demo',
  'open-meteo': 'Open-Meteo',
  'web-scrape': 'wttr.in',
  openweather: 'OpenWeatherMap',
}

function formatCoord(value: number | null, posSuffix: string, negSuffix: string): string {
  if (value === null) return '—'
  const abs = Math.abs(value).toFixed(4)
  return `${abs}°${value >= 0 ? posSuffix : negSuffix}`
}

function statusIcon(status: string): string {
  if (status === 'ok') return '✓'
  if (status === 'skipped') return '–'
  return '✗'
}

export function CrosshairOverlay() {
  const active = useCrosshairStore((s) => s.active)
  const screenX = useCrosshairStore((s) => s.screenX)
  const screenY = useCrosshairStore((s) => s.screenY)
  const lat = useCrosshairStore((s) => s.lat)
  const lon = useCrosshairStore((s) => s.lon)
  const multiSourceMode = useCrosshairStore((s) => s.multiSourceMode)
  const consensusTempC = useCrosshairStore((s) => s.consensusTempC)
  const tempC = useCrosshairStore((s) => s.tempC)
  const confidence = useCrosshairStore((s) => s.confidence)
  const sources = useCrosshairStore((s) => s.sources)
  const primaryUsed = useCrosshairStore((s) => s.primaryUsed)
  const source = useCrosshairStore((s) => s.source)
  const sourcesExpanded = useCrosshairStore((s) => s.sourcesExpanded)
  const toggleSourcesExpanded = useCrosshairStore((s) => s.toggleSourcesExpanded)

  if (!active) return null

  const displayTemp = multiSourceMode ? consensusTempC : tempC
  const tempLabel = displayTemp === null ? '— °C' : `${displayTemp.toFixed(1)} °C`
  const confidenceClass = `crosshair-confidence crosshair-confidence--${confidence}`

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
        <div className={`crosshair-hud-row crosshair-hud-temp ${confidenceClass}`}>
          {multiSourceMode && <span className="crosshair-hud-consensus-label">共识 </span>}
          {tempLabel}
          {multiSourceMode && (
            <span className="crosshair-hud-confidence" title="多源离散度置信度">
              {' '}
              · {confidence}
            </span>
          )}
        </div>
        {!multiSourceMode && (
          <div className="crosshair-hud-row crosshair-hud-source">source: {source}</div>
        )}
        {multiSourceMode && sources.length > 0 && (
          <>
            <button
              type="button"
              className="crosshair-hud-toggle"
              onClick={toggleSourcesExpanded}
            >
              {sourcesExpanded ? '收起来源' : '展开来源'} ({sources.length})
            </button>
            {(sourcesExpanded || sources.length <= 3) && (
              <ul className="crosshair-sources-list">
                {sources.map((row) => (
                  <li key={row.id} className={`crosshair-source crosshair-source--${row.status}`}>
                    <span className="crosshair-source-icon" aria-hidden>
                      {statusIcon(row.status)}
                    </span>
                    <span className="crosshair-source-name">
                      {SOURCE_LABELS[row.id] ?? row.id}
                    </span>
                    <span className="crosshair-source-temp">
                      {row.temp_c === null ? '—' : `${row.temp_c.toFixed(1)}°C`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="crosshair-hud-row crosshair-hud-source">
              primary: {SOURCE_LABELS[primaryUsed] ?? primaryUsed}
            </div>
          </>
        )}
      </div>
    </>
  )
}
