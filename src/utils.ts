import type { Component, ComponentId, Item, ItemsData, ProgressState, SrsCard } from './types'

const STORAGE_KEY = 'tft-item-flashcards-18.2'
const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS
export const SRS_SESSION_LIMIT = 20

export function getComponentMap(data: ItemsData): Record<ComponentId, Component> {
  return Object.fromEntries(data.components.map((c) => [c.id, c])) as Record<
    ComponentId,
    Component
  >
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function defaultSrsCard(now = Date.now()): SrsCard {
  return {
    intervalDays: 0,
    ease: 2.5,
    dueAt: now,
    reps: 0,
    lapses: 0,
  }
}

export function emptyProgress(): ProgressState {
  return { seen: [], mastered: [], quizCorrect: 0, quizTotal: 0, srs: {} }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    return {
      seen: parsed.seen ?? [],
      mastered: parsed.mastered ?? [],
      quizCorrect: parsed.quizCorrect ?? 0,
      quizTotal: parsed.quizTotal ?? 0,
      srs: parsed.srs ?? {},
    }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Grade an item and return updated progress (also marks seen). */
export function gradeSrs(
  progress: ProgressState,
  itemId: string,
  correct: boolean,
  now = Date.now(),
): ProgressState {
  const prev = progress.srs[itemId] ?? defaultSrsCard(now)
  let next: SrsCard

  if (!correct) {
    next = {
      ...prev,
      intervalDays: 0,
      dueAt: now + 10 * MINUTE_MS,
      lapses: prev.lapses + 1,
      ease: Math.max(1.3, prev.ease - 0.2),
    }
  } else if (prev.reps === 0 || prev.intervalDays === 0) {
    next = {
      ...prev,
      intervalDays: 1,
      dueAt: now + DAY_MS,
      reps: prev.reps + 1,
    }
  } else {
    const intervalDays = Math.max(1, Math.round(prev.intervalDays * prev.ease))
    next = {
      ...prev,
      intervalDays,
      ease: Math.min(3.0, prev.ease + 0.05),
      dueAt: now + intervalDays * DAY_MS,
      reps: prev.reps + 1,
    }
  }

  const seen = progress.seen.includes(itemId)
    ? progress.seen
    : [...progress.seen, itemId]

  let mastered = progress.mastered
  if (correct && next.intervalDays >= 1 && !mastered.includes(itemId)) {
    mastered = [...mastered, itemId]
  }

  return {
    ...progress,
    seen,
    mastered,
    srs: { ...progress.srs, [itemId]: next },
  }
}

export interface SrsCounts {
  dueToday: number
  newOrLearning: number
}

export function getSrsCounts(items: Item[], progress: ProgressState, now = Date.now()): SrsCounts {
  let dueToday = 0
  let newOrLearning = 0
  for (const item of items) {
    const card = progress.srs[item.id]
    if (!card) {
      newOrLearning++
      dueToday++
      continue
    }
    if (card.intervalDays === 0 || card.reps === 0) {
      newOrLearning++
    }
    if (card.dueAt <= now) {
      dueToday++
    }
  }
  return { dueToday, newOrLearning }
}

/**
 * Prefer due items, then new. Sort: overdue first, then new, shuffle within buckets.
 * Cap at `limit` (default 20): all due first, fill with new up to limit.
 */
export function buildSrsQueue(
  items: Item[],
  progress: ProgressState,
  limit = SRS_SESSION_LIMIT,
  now = Date.now(),
): Item[] {
  const overdue: Item[] = []
  const dueNow: Item[] = []
  const neu: Item[] = []
  const learning: Item[] = []

  for (const item of items) {
    const card = progress.srs[item.id]
    if (!card) {
      neu.push(item)
      continue
    }
    if (card.dueAt > now) continue
    if (card.intervalDays === 0 || card.reps === 0) {
      learning.push(item)
    } else {
      if (card.dueAt <= now - DAY_MS) overdue.push(item)
      else dueNow.push(item)
    }
  }

  const buckets = [
    shuffle(overdue),
    shuffle(dueNow),
    shuffle(learning),
    shuffle(neu),
  ]

  const queue: Item[] = []
  for (const bucket of buckets) {
    for (const item of bucket) {
      if (queue.length >= limit) return queue
      queue.push(item)
    }
  }
  return queue
}

export function pickDistractors(
  items: Item[],
  correct: Item,
  field: 'nameZh' | 'effect',
  count = 3,
): string[] {
  const pool = shuffle(
    items.filter((i) => i.id !== correct.id).map((i) => i[field]),
  )
  const unique = [...new Set(pool)].filter((v) => v !== correct[field])
  return unique.slice(0, count)
}

export function componentLabel(
  map: Record<ComponentId, Component>,
  id: ComponentId,
): string {
  return map[id]?.nameZh ?? id
}
