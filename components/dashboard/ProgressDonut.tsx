'use client'

import { useMemo } from 'react'

const STATUS_COLORS = {
  new: 'rgb(var(--color-srs-new))',
  learning: 'rgb(var(--color-srs-learning))',
  review: 'rgb(var(--color-srs-review))',
  mature: 'rgb(var(--color-srs-mature))',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  learning: 'Learning',
  review: 'Review',
  mature: 'Mature',
}

export default function ProgressDonut({
  counts,
}: {
  counts: Record<string, number>
}) {
  const statuses = ['new', 'learning', 'review', 'mature'] as const
  const total = statuses.reduce((s, k) => s + (counts[k] ?? 0), 0)

  if (total === 0) return null

  const size = 80
  const cx = size / 2
  const cy = size / 2
  const r = 28
  const strokeWidth = 14

  // Build arc segments
  const segments = useMemo(() => {
    let cumulativeAngle = 0
    return statuses
      .filter(s => (counts[s] ?? 0) > 0)
      .map(s => {
        const pct = (counts[s] ?? 0) / total
        const angle = pct * 360
        const start = cumulativeAngle
        cumulativeAngle += angle
        return { key: s, pct, start, end: cumulativeAngle, count: counts[s] ?? 0 }
      })
  }, [counts, total])

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
  }

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Progress: ${statuses.filter(s => (counts[s] ?? 0) > 0).map(s => `${STATUS_LABELS[s]} ${counts[s]}`).join(', ')}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(var(--color-border))" strokeWidth={strokeWidth} />
        {segments.map(seg => (
          <path
            key={seg.key}
            d={arcPath(cx, cy, r, seg.start, seg.end)}
            fill="none"
            style={{ stroke: STATUS_COLORS[seg.key] }}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}
      </svg>

      <div className="space-y-1">
        {statuses
          .filter(s => (counts[s] ?? 0) > 0)
          .map(s => (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[s] }}
              />
              <span className="text-muted">{STATUS_LABELS[s]}</span>
              <span className="font-medium text-ink ml-auto pl-2">{counts[s]}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
