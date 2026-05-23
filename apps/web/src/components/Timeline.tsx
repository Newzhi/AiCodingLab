type Props = {
  times: string[]
  value: string | null
  onChange: (time: string) => void
}

export function Timeline({ times, value, onChange }: Props) {
  if (!times.length) {
    return (
      <div className="panel timeline">
        <span>暂无预报时次 — 请运行 API 并 POST /ingest/demo</span>
      </div>
    )
  }

  const index = Math.max(0, times.indexOf(value ?? times[0]))

  return (
    <div className="panel timeline">
      <label htmlFor="time-slider">预报时次</label>
      <input
        id="time-slider"
        type="range"
        min={0}
        max={times.length - 1}
        value={index}
        onChange={(e) => onChange(times[Number(e.target.value)])}
      />
      <time>{value ?? times[0]}</time>
    </div>
  )
}
