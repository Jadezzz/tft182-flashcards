import { useCallback, useMemo, useState } from 'react'
import type { Component, ComponentId, Item, ProgressState } from '../types'
import { pickDistractors, shuffle } from '../utils'
import { ItemIcon } from './ItemIcon'
import { RecipePair } from './RecipePair'

interface Props {
  items: Item[]
  map: Record<ComponentId, Component>
  progress: ProgressState
  onProgress: (next: ProgressState) => void
  onBack: () => void
}

type Phase = 'name' | 'effect' | 'done'

interface Question {
  item: Item
  nameOptions: Item[]
  effectOptions: string[]
}

function buildQuestion(items: Item[], item: Item): Question {
  const nameDistractors = shuffle(items.filter((i) => i.id !== item.id)).slice(0, 3)
  return {
    item,
    nameOptions: shuffle([item, ...nameDistractors]),
    effectOptions: shuffle([item.effect, ...pickDistractors(items, item, 'effect', 3)]),
  }
}

export function QuizMode({ items, map, progress, onProgress, onBack }: Props) {
  const [queue, setQueue] = useState<Item[]>(() => shuffle(items))
  const [retry, setRetry] = useState<Item[]>([])
  const [phase, setPhase] = useState<Phase>('name')
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [nameOk, setNameOk] = useState(false)
  const [qKey, setQKey] = useState(0)

  const current = queue[0]
  const question = useMemo(() => {
    if (!current) return null
    return buildQuestion(items, current)
  }, [current, items, qKey])

  const remaining = queue.length + retry.length

  const advance = useCallback(
    (allCorrect: boolean) => {
      if (!current) return
      const rest = queue.slice(1)
      let nextRetry = retry
      if (!allCorrect) {
        nextRetry = [...retry, current]
      } else if (!progress.mastered.includes(current.id)) {
        onProgress({
          ...progress,
          mastered: [...progress.mastered, current.id],
          seen: progress.seen.includes(current.id)
            ? progress.seen
            : [...progress.seen, current.id],
        })
      }

      if (rest.length === 0) {
        if (nextRetry.length > 0) {
          setQueue(shuffle(nextRetry))
          setRetry([])
        } else {
          setQueue([])
          setPhase('done')
          return
        }
      } else {
        setQueue(rest)
        setRetry(nextRetry)
      }
      setPhase('name')
      setSelected(null)
      setFeedback(null)
      setNameOk(false)
      setQKey((k) => k + 1)
    },
    [current, onProgress, progress, queue, retry],
  )

  const answer = (value: string) => {
    if (feedback || !question) return
    const correct =
      phase === 'name' ? question.item.nameZh === value : question.item.effect === value
    setSelected(value)
    setFeedback(correct ? 'correct' : 'wrong')

    onProgress({
      ...progress,
      quizTotal: progress.quizTotal + 1,
      quizCorrect: progress.quizCorrect + (correct ? 1 : 0),
      seen: progress.seen.includes(question.item.id)
        ? progress.seen
        : [...progress.seen, question.item.id],
    })

    window.setTimeout(() => {
      if (phase === 'name') {
        setNameOk(correct)
        setPhase('effect')
        setSelected(null)
        setFeedback(null)
      } else {
        advance(nameOk && correct)
      }
    }, 900)
  }

  if (phase === 'done' || !current || !question) {
    return (
      <div className="panel">
        <header className="panel-header">
          <button type="button" className="btn ghost" onClick={onBack}>
            ← 返回
          </button>
          <span className="meta">測驗完成</span>
        </header>
        <div className="empty-state">
          <h2>全部答完了！</h2>
          <p>
            累計正確 {progress.quizCorrect} / {progress.quizTotal}
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              setQueue(shuffle(items))
              setRetry([])
              setPhase('name')
              setSelected(null)
              setFeedback(null)
              setNameOk(false)
              setQKey((k) => k + 1)
            }}
          >
            再測一輪
          </button>
        </div>
      </div>
    )
  }

  const prompt = phase === 'name' ? '這組合成是哪個裝備？' : '主要效果是？'

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

      <div className="quiz-prompt">
        <RecipePair a={current.components[0]} b={current.components[1]} map={map} />
        <h2>{prompt}</h2>
        <p className="sub">{phase === 'name' ? '題目 A · 名稱' : '題目 B · 效果'}</p>
      </div>

      <div className="options" role="listbox">
        {phase === 'name'
          ? question.nameOptions.map((optItem) => {
              const opt = optItem.nameZh
              let cls = 'option option-with-icon'
              if (selected === opt) {
                cls += feedback === 'correct' ? ' correct' : ' wrong'
              } else if (feedback && opt === question.item.nameZh) {
                cls += ' correct'
              }
              return (
                <button
                  key={optItem.id}
                  type="button"
                  className={cls}
                  onClick={() => answer(opt)}
                  disabled={!!feedback}
                >
                  <ItemIcon item={optItem} size={36} className="option-icon" />
                  <span>{opt}</span>
                </button>
              )
            })
          : question.effectOptions.map((opt) => {
              let cls = 'option'
              if (selected === opt) {
                cls += feedback === 'correct' ? ' correct' : ' wrong'
              } else if (feedback && opt === question.item.effect) {
                cls += ' correct'
              }
              return (
                <button
                  key={opt}
                  type="button"
                  className={cls}
                  onClick={() => answer(opt)}
                  disabled={!!feedback}
                >
                  {opt}
                </button>
              )
            })}
      </div>

      {feedback && (
        <p className={`feedback ${feedback}`} role="status">
          {feedback === 'correct' ? '正確！' : '答錯了，已加入重練佇列'}
        </p>
      )}
    </div>
  )
}
