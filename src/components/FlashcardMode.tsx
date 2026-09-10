import { useCallback, useMemo, useState } from 'react'
import type { Component, ComponentId, Item, ProgressState } from '../types'
import { shuffle } from '../utils'
import { ItemIcon } from './ItemIcon'
import { RecipePair } from './RecipePair'

interface Props {
  items: Item[]
  map: Record<ComponentId, Component>
  progress: ProgressState
  onProgress: (next: ProgressState) => void
  onBack: () => void
}

export function FlashcardMode({ items, map, progress, onProgress, onBack }: Props) {
  const deck = useMemo(() => shuffle(items), [items])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const current = deck[index]

  const markSeen = useCallback(
    (id: string) => {
      if (progress.seen.includes(id)) return
      onProgress({ ...progress, seen: [...progress.seen, id] })
    },
    [onProgress, progress],
  )

  const flip = () => {
    if (!flipped) markSeen(current.id)
    setFlipped((f) => !f)
  }

  const next = (mastered: boolean) => {
    let nextProgress = progress
    if (mastered && !progress.mastered.includes(current.id)) {
      nextProgress = {
        ...progress,
        mastered: [...progress.mastered, current.id],
        seen: progress.seen.includes(current.id)
          ? progress.seen
          : [...progress.seen, current.id],
      }
      onProgress(nextProgress)
    } else if (!progress.seen.includes(current.id)) {
      nextProgress = { ...progress, seen: [...progress.seen, current.id] }
      onProgress(nextProgress)
    }
    setFlipped(false)
    setIndex((i) => (i + 1) % deck.length)
  }

  return (
    <div className="panel">
      <header className="panel-header">
        <button type="button" className="btn ghost" onClick={onBack}>
          ← 返回
        </button>
        <span className="meta">
          閃卡 {index + 1}/{deck.length}
        </span>
      </header>

      <button
        type="button"
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={flip}
        aria-label={flipped ? '顯示正面' : '翻轉看答案'}
      >
        {!flipped ? (
          <div className="card-face front">
            <p className="hint">點擊翻轉</p>
            <RecipePair a={current.components[0]} b={current.components[1]} map={map} />
          </div>
        ) : (
          <div className="card-face back">
            <ItemIcon item={current} size={72} className="item-icon-lg" />
            <h2 className="item-name">{current.nameZh}</h2>
            <p className="item-en">{current.nameEn}</p>
            <p className="item-effect">{current.effect}</p>
            <RecipePair a={current.components[0]} b={current.components[1]} map={map} />
          </div>
        )}
      </button>

      <div className="actions row">
        <button type="button" className="btn secondary grow" onClick={() => next(false)}>
          下一張
        </button>
        <button type="button" className="btn primary grow" onClick={() => next(true)}>
          已記住
        </button>
      </div>
    </div>
  )
}
