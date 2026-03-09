'use client'

interface ForecastProps {
  buckets: { date: string; count: number }[]
}

export default function SrsForecast({ buckets }: ForecastProps) {
  if (buckets.length === 0) return null

  const maxCount = Math.max(...buckets.map(b => b.count), 1)

  return (
    <div>
      <div className="flex items-end gap-px h-32">
        {buckets.map(b => {
          const height = Math.max((b.count / maxCount) * 100, b.count > 0 ? 4 : 0)
          const isToday = b.date === buckets[0]?.date
          return (
            <div
              key={b.date}
              className="flex-1 h-full group relative flex items-end"
              title={`${b.date}: ${b.count} reviews`}
            >
              <div
                className={`w-full rounded-t transition-colors ${
                  isToday ? 'bg-terracotta' : 'bg-terracotta/40 group-hover:bg-terracotta/70'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted">Today</span>
        <span className="text-[10px] text-muted">+30 days</span>
      </div>
    </div>
  )
}
