export default function StreakCounter({ days }: { days: number }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <p className="text-xs text-muted uppercase tracking-wide mb-1">Streak</p>
      <p className="font-serif text-3xl text-ink">
        {days} <span className="text-xl">🔥</span>
      </p>
      <p className="text-xs text-muted mt-1">
        {days === 1 ? 'day' : 'days'} in a row
      </p>
    </div>
  )
}
