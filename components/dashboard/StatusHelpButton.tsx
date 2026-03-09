'use client'

import { useState, useRef, useEffect } from 'react'

export default function StatusHelpButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-5 h-5 rounded-full border border-border text-muted text-xs hover:text-ink hover:border-ink transition-colors flex items-center justify-center"
        aria-label="What do the statuses mean?"
      >
        ?
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 w-64 bg-surface border border-border rounded-lg shadow-lg p-3 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-srs-new shrink-0" />
            <div><span className="font-medium text-ink">New</span> — Not yet studied.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-srs-learning shrink-0" />
            <div><span className="font-medium text-ink">Learning</span> — Short review intervals while it sticks.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-srs-review shrink-0" />
            <div><span className="font-medium text-ink">Review</span> — Reviewed on a growing schedule.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-srs-mature shrink-0" />
            <div><span className="font-medium text-ink">Mature</span> — Long intervals. You&apos;ve got this.</div>
          </div>
        </div>
      )}
    </div>
  )
}
