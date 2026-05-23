/** Pick the processed valid_time closest to real UTC now. */
export function pickNearestValidTime(
  times: string[],
  now: Date = new Date(),
): string | null {
  if (!times.length) return null
  const nowMs = now.getTime()
  let best = times[0]
  let bestDelta = Math.abs(new Date(best).getTime() - nowMs)
  for (const t of times.slice(1)) {
    const delta = Math.abs(new Date(t).getTime() - nowMs)
    if (delta < bestDelta) {
      best = t
      bestDelta = delta
    }
  }
  return best
}

export type TimeSelectionMeta = {
  selected: string
  isCurrent: boolean
  isNearestAvailable: boolean
  offsetHours: number
}

const CURRENT_TOLERANCE_MS = 45 * 60 * 1000

export function describeTimeSelection(
  iso: string,
  now: Date = new Date(),
): TimeSelectionMeta {
  const targetMs = new Date(iso).getTime()
  const nowMs = now.getTime()
  const offsetHours = (targetMs - nowMs) / 3_600_000
  const isCurrent = Math.abs(targetMs - nowMs) <= CURRENT_TOLERANCE_MS
  return {
    selected: iso,
    isCurrent,
    isNearestAvailable: !isCurrent,
    offsetHours,
  }
}

export function formatTimeBadge(iso: string, now: Date = new Date()): string {
  const meta = describeTimeSelection(iso, now)
  if (meta.isCurrent) return '当前'
  const h = Math.round(meta.offsetHours)
  if (h === 0) return '最近可用'
  if (h > 0) return `+${h}h 预报`
  return `${h}h 前`
}
