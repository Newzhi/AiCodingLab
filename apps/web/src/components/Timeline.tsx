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
      <div className="panel timeline timeline--compact">
        <span className="timeline-hint">暂无预报时次 — 请运行 API 并 POST /ingest/demo</span>
      </div>
    )
  }

  const current = value ?? times[0]
  const index = Math.max(0, times.indexOf(current))

  const goPrev = () => {
    if (index > 0) onChange(times[index - 1])
  }
  const goNext = () => {
    if (index < times.length - 1) onChange(times[index + 1])
  }

  if (times.length <= 3) {
    return (
      <div className="panel timeline timeline--compact" role="group" aria-label="预报时次">
        <span className="timeline-label">预报时次</span>
        <div className="timeline-chips">
          {times.map((t) => (
            <button
              key={t}
              type="button"
              className={`timeline-chip${t === current ? ' timeline-chip--active' : ''}`}
              onClick={() => onChange(t)}
              title={t}
            >
              {formatForecastTime(t)}
            </button>
          ))}
        </div>
        <div className="timeline-nav">
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
      </div>
    )
  }

  return (
    <div className="panel timeline timeline--compact">
      <label className="timeline-label" htmlFor="time-slider">
        预报时次
      </label>
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
          aria-valuetext={formatForecastTime(current)}
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
      <time className="timeline-current" dateTime={current}>
        {formatForecastTime(current)} UTC
      </time>
    </div>
  )
}
