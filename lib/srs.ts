import type { SrsCard, Rating } from './types'

export interface SrsUpdate {
  ease_factor: number
  interval: number
  repetitions: number
  due_date: string
  status: SrsCard['status']
  last_reviewed_at: string
}

export function applySrs(card: SrsCard, rating: Rating): SrsUpdate {
  const now = new Date()
  let { ease_factor, interval, repetitions } = card

  if (rating === 0) {
    // Again: reset to start
    interval = 1
    repetitions = 0
    ease_factor = Math.max(1.3, ease_factor - 0.2)
  } else {
    // Successful recall — advance interval
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * ease_factor)
    }

    if (rating === 1) {
      // Hard
      interval = Math.max(1, Math.round(interval * 1.2))
      ease_factor = Math.max(1.3, ease_factor - 0.15)
    } else if (rating === 2) {
      // Good — ease_factor unchanged
    } else if (rating === 3) {
      // Easy
      interval = Math.round(interval * ease_factor * 1.3)
      ease_factor = ease_factor + 0.15
    }

    repetitions += 1
  }

  const due = new Date(now)
  due.setDate(due.getDate() + interval)

  let status: SrsCard['status']
  if (rating === 0) {
    status = 'learning'
  } else if (repetitions <= 1) {
    status = 'learning'
  } else if (interval > 21) {
    status = 'mature'
  } else {
    status = 'review'
  }

  return {
    ease_factor,
    interval,
    repetitions,
    due_date: due.toISOString(),
    status,
    last_reviewed_at: now.toISOString(),
  }
}
