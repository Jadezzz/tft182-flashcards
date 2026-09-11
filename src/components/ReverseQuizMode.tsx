import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Component, ComponentId, Item, ProgressState } from '../types'
import { buildSrsQueue, gradeSrs, shuffle } from '../utils'
import { ComponentChip } from './ComponentChip'
import { ItemIcon } from './ItemIcon'

interface Props {
  items: Item[]
  components: Component[]
  map: Record<ComponentId, Component>
  progress: ProgressState
  onProgress: (next: ProgressState) => void
  onBack: () => void
  initialQueue?: Item[]
}

type Phase = 'pick' | 'done'
type Slots = [ComponentId | null, ComponentId | null]

function recipesMatch(picked: [ComponentId, ComponentId], answer: [ComponentId, ComponentId]) {
  const a = [...picked].sort()
  const b = [...answer].sort()
  return a[0] === b[0] && a[1] === b[1]
}

export function ReverseQuizMode({
  items,
  components,
  map,
  progress,
  onProgress,
  onBack,
  initialQueue,
}: Props) {
  const [queue, setQueue] = useState<Item[]>(
    () => initialQueue ?? buildSrsQueue(items, progress),
  )
  const [retry, setRetry] = useState<Item[]>([])
  const [phase, setPhase] = useState<Phase>('pick')
  const [slots, setSlots] = useState<Slots>([null, null])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [qKey, setQKey] = useState(0)
  const checkTimer = useRef<number | null>(null)
  const checkingRef = useRef(false)
  const progressRef = useRef(progress)
  progressRef.current = progress

  const current = queue[0]
  const remaining = queue.length + retry.length
  const filledCount = (slots[0] ? 1 : 0) + (slots[1] ? 1 : 0)

  const clearCheckTimer = () => {
    if (checkTimer.current !== null) {
      window.clearTimeout(checkTimer.current)
      checkTimer.current = null
    }
  }

  const advance = useCallback(
    (allCorrect: boolean, item: Item) => {
      const rest = queue.slice(1)
      let nextRetry = retry
      if (!allCorrect) {
        nextRetry = [...retry, item]
      }

      if (rest.length === 0) {
        if (nextRetry.length > 0) {
          setQueue(shuffle(nextRetry))
          setRetry([])
        } else {
          setQueue([])
          setPhase('done')
          setSlots([null, null])
          setFeedback(null)
          checkingRef.current = false
          return
        }
      } else {
        setQueue(rest)
        setRetry(nextRetry)
      }
      setSlots([null, null])
      setFeedback(null)
      checkingRef.current = false
      setQKey((k) => k + 1)
    },
    [queue, retry],
  )

  const checkAnswer = useCallback(
    (picked: [ComponentId, ComponentId], item: Item) => {
      if (checkingRef.current) return
      checkingRef.current = true
      const correct = recipesMatch(picked, item.components)
      setFeedback(correct ? 'correct' : 'wrong')

      const prog = progressRef.current
      const withStats: ProgressState = {
        ...prog,
        quizTotal: prog.quizTotal + 1,
        quizCorrect: prog.quizCorrect + (correct ? 1 : 0),
      }
      onProgress(gradeSrs(withStats, item.id, correct))

      window.setTimeout(() => {
        advance(correct, item)
      }, correct ? 1200 : 3000)
    },
    [advance, onProgress],
  )

  useEffect(() => {
    clearCheckTimer()
    if (feedback || !current || checkingRef.current) return
    if (slots[0] && slots[1]) {
      const item = current
      const picked: [ComponentId, ComponentId] = [slots[0], slots[1]]
      checkTimer.current = window.setTimeout(() => {
        checkAnswer(picked, item)
      }, 300)
    }
    return clearCheckTimer
  }, [slots, feedback, current, checkAnswer, qKey])

  const pickComponent = (id: ComponentId) => {
    if (feedback || checkingRef.current) return
    setSlots((prev) => {
      if (!prev[0]) return [id, prev[1]]
      if (!prev[1]) return [prev[0], id]
      return prev
    })
  }

  const clearSlot = (index: 0 | 1) => {
    if (feedback || checkingRef.current) return
    clearCheckTimer()
    setSlots((prev) => {
      const next: Slots = [prev[0], prev[1]]
      next[index] = null
      return next
    })
  }

  const slotComponents = useMemo(
    () =>
      slots.map((id) => (id ? map[id] : null)) as [
        Component | null,
        Component | null,
      ],
    [slots, map],
  )

  if (phase === 'done' || !current) {
    return (
      <div className="panel">
        <header className="panel-header">
          <button type="button" className="btn ghost" onClick={onBack}>
            ← 返回
          </button>
          <span className="meta">反向測驗完成</span>
        </header>
        <div className="empty-state">
          <h2>這一輪練完了！</h2>
          <p>
            累計正確 {progress.quizCorrect} / {progress.quizTotal}
            <br />
            <span className="sub">答對的卡會延後再出；再測一輪可提前複習。</span>
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const next = buildSrsQueue(items, progressRef.current, undefined, Date.now(), {
                includeAhead: true,
              })
              setQueue(next)
              setRetry([])
              setPhase('pick')
              setSlots([null, null])
              setFeedback(null)
              checkingRef.current = false
              setQKey((k) => k + 1)
            }}
          >
            再測一輪（可提前複習）
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <header className="panel-header">
        <button type="button" className="btn ghost" onClick={onBack}>
          ← 返回
        </button>
        <span className="meta">
          剩餘 {remaining} · 重練 {retry.length}
        </span>
      </header>

      <div className="quiz-prompt reverse-prompt">
        <ItemIcon item={current} size={72} className="item-icon-lg" />
        <h2>{current.nameZh}</h2>
        <p className="item-en">{current.nameEn}</p>
        <p className="sub">這件裝備由哪兩件基本元件合成？</p>
      </div>

      <div className="reverse-slots" aria-label={`已選 ${filledCount}/2`}>
        <p className="reverse-slots-label">已選 {filledCount}/2</p>
        <div className="reverse-slots-row">
          {([0, 1] as const).map((i) => {
            const comp = slotComponents[i]
            let cls = 'reverse-slot'
            if (feedback === 'correct') cls += ' correct'
            else if (feedback === 'wrong' && comp) cls += ' wrong'
            return (
              <button
                key={i}
                type="button"
                className={cls}
                onClick={() => clearSlot(i)}
                disabled={!!feedback || !comp}
                aria-label={comp ? `清除 ${comp.nameZh}` : `空槽位 ${i + 1}`}
              >
                {comp ? (
                  <ComponentChip component={comp} size="md" />
                ) : (
                  <span className="reverse-slot-empty">點選下方元件</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="component-grid" role="listbox" aria-label="基本元件">
        {components.map((comp) => {
          const selectedCount =
            (slots[0] === comp.id ? 1 : 0) + (slots[1] === comp.id ? 1 : 0)
          return (
            <button
              key={comp.id}
              type="button"
              className={`component-pick${selectedCount > 0 ? ' selected' : ''}`}
              onClick={() => pickComponent(comp.id)}
              disabled={!!feedback || filledCount === 2}
            >
              <ComponentChip component={comp} size="md" selected={selectedCount > 0} />
              {selectedCount > 0 && (
                <span className="component-pick-count" aria-hidden>
                  ×{selectedCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {feedback && (
        <p className={`feedback ${feedback}`} role="status">
          {feedback === 'correct'
            ? '正確！'
            : `答錯了（${map[current.components[0]].nameZh} + ${map[current.components[1]].nameZh}），已加入重練佇列`}
        </p>
      )}
    </div>
  )
}
