import type { Component, ComponentId, Item, ItemsData, ProgressState } from './types'

const STORAGE_KEY = 'tft-item-flashcards-18.2'

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

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { seen: [], mastered: [], quizCorrect: 0, quizTotal: 0 }
    const parsed = JSON.parse(raw) as ProgressState
    return {
      seen: parsed.seen ?? [],
      mastered: parsed.mastered ?? [],
      quizCorrect: parsed.quizCorrect ?? 0,
      quizTotal: parsed.quizTotal ?? 0,
    }
  } catch {
    return { seen: [], mastered: [], quizCorrect: 0, quizTotal: 0 }
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
