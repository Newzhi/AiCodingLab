import { describeTimeSelection, formatTimeBadge } from '../utils/timeSelection'

type Props = {
  times: string[]
  value: string | null
  onChange: (time: string) => void
}

function formatForecastTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('zh-CN', {
    timeZone: 'UTC',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function Timeline({ times, value, onChange }: Props) {
  if (!times.length) {
    return (
      <div className="panel timeline timeline--compact timeline--corner">
        <span className="timeline-hint">暂无预报时次</span>
      </div>
    )
  }

  const current = value ?? times[0]
  const index = Math.max(0, times.indexOf(current))
  const badge = formatTimeBadge(current)
  const meta = describeTimeSelection(current)

  const goPrev = () => {
    if (index > 0) onChange(times[index - 1])
  }
  const goNext = () => {
    if (index < times.length - 1) onChange(times[index + 1])
  }

  return (
    <div
      className="panel timeline timeline--compact timeline--corner"
      role="group"
      aria-label="预报时次"
    >
      <div className="timeline-header">
        <span className="timeline-label">预报时次</span>
        <span
          className={`timeline-badge${meta.isCurrent ? ' timeline-badge--current' : ''}`}
          title={
            meta.isNearestAvailable
              ? '已对齐至最近可用预处理时次（演示/GFS 桶）'
              : '与当前 UTC 时刻对齐'
          }
        >
          {badge}
        </span>
      </div>

      {times.length <= 4 ? (
        <div className="timeline-chips">
          {times.map((t) => (
            <button
              key={t}
              type="button"
              className={`timeline-chip${t === current ? ' timeline-chip--active' : ''}`}
              onClick={() => onChange(t)}
              title={`${formatTimeBadge(t)} · ${t}`}
            >
              {formatForecastTime(t)}
            </button>
          ))}
        </div>
      ) : (
        <div className="timeline-slider-row">
          <button type="button" className="timeline-nav-btn" onClick={goPrev} disabled={index <= 0}>
            ‹
          </button>
          <input
            id="time-slider"
            type="range"
            min={0}
            max={times.length - 1}
            step={1}
            value={index}
            onChange={(e) => onChange(times[Number(e.target.value)])}
            aria-valuetext={`${badge} ${formatForecastTime(current)} UTC`}
          />
          <button
            type="button"
            className="timeline-nav-btn"
            onClick={goNext}
            disabled={index >= times.length - 1}
          >
            ›
          </button>
        </div>
      )}

      <div className="timeline-footer">
        <button type="button" className="timeline-nav-btn" onClick={goPrev} disabled={index <= 0}>
          ‹
        </button>
        <time className="timeline-current" dateTime={current}>
          {formatForecastTime(current)} UTC
        </time>
        <button
          type="button"
          className="timeline-nav-btn"
          onClick={goNext}
          disabled={index >= times.length - 1}
        >
          ›
        </button>
      </div>
      {meta.isNearestAvailable && (
        <p className="timeline-nearest-hint">最近可用预报（非实时观测）</p>
      )}
    </div>
  )
}
