import { useCallback, useMemo, useState } from 'react'
import raw from './data/items-18.2.json'
import { FlashcardMode } from './components/FlashcardMode'
import { QuizMode } from './components/QuizMode'
import { ReverseQuizMode } from './components/ReverseQuizMode'
import type { ComponentId, ItemsData, Item, Mode, ProgressState } from './types'
import {
  buildSrsQueue,
  emptyProgress,
  getComponentMap,
  getSrsCounts,
  loadProgress,
  saveProgress,
} from './utils'
import './App.css'

const itemsData: ItemsData = {
  patch: raw.patch,
  set: raw.set,
  components: raw.components as ItemsData['components'],
  items: raw.items.map((item) => ({
    ...item,
    components: item.components as [ComponentId, ComponentId],
  })) as Item[],
}

export default function App() {
  const [mode, setMode] = useState<Mode>('home')
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())
  const [sessionQueue, setSessionQueue] = useState<Item[] | null>(null)
  const map = useMemo(() => getComponentMap(itemsData), [])
  const srsCounts = useMemo(
    () => getSrsCounts(itemsData.items, progress),
    [progress],
  )

  const updateProgress = useCallback((next: ProgressState) => {
    setProgress(next)
    saveProgress(next)
  }, [])

  const resetProgress = () => {
    updateProgress(emptyProgress())
  }

  const startQuiz = () => {
    const due = buildSrsQueue(itemsData.items, progress)
    setSessionQueue(
      due.length > 0
        ? due
        : buildSrsQueue(itemsData.items, progress, undefined, Date.now(), {
            includeAhead: true,
          }),
    )
    setMode('quiz')
  }

  const startReverse = () => {
    const due = buildSrsQueue(itemsData.items, progress)
    setSessionQueue(
      due.length > 0
        ? due
        : buildSrsQueue(itemsData.items, progress, undefined, Date.now(), {
            includeAhead: true,
          }),
    )
    setMode('reverse')
  }

  const goHome = () => {
    setSessionQueue(null)
    setMode('home')
  }

  if (mode === 'quiz') {
    return (
      <div className="app">
        <QuizMode
          items={itemsData.items}
          map={map}
          progress={progress}
          onProgress={updateProgress}
          onBack={goHome}
          initialQueue={sessionQueue ?? undefined}
        />
      </div>
    )
  }

  if (mode === 'reverse') {
    return (
      <div className="app">
        <ReverseQuizMode
          items={itemsData.items}
          components={itemsData.components}
          map={map}
          progress={progress}
          onProgress={updateProgress}
          onBack={goHome}
          initialQueue={sessionQueue ?? undefined}
        />
      </div>
    )
  }

  if (mode === 'flashcard') {
    return (
      <div className="app">
        <FlashcardMode
          items={itemsData.items}
          map={map}
          progress={progress}
          onProgress={updateProgress}
          onBack={goHome}
        />
      </div>
    )
  }

  const accuracy =
    progress.quizTotal > 0
      ? Math.round((progress.quizCorrect / progress.quizTotal) * 100)
      : null

  return (
    <div className="app">
      <header className="hero">
        <p className="badge">
          Set {itemsData.set} · Patch {itemsData.patch}
        </p>
        <h1>TFT 裝備閃卡</h1>
        <p className="lede">
          經典 8 元件 · {itemsData.items.length} 組合成
          <br />
          測驗 + 反向 + 閃卡 · 進度存在本機
        </p>
      </header>

      <section className="stats srs-stats" aria-label="間隔重複">
        <div className="stat highlight">
          <strong>{srsCounts.dueToday}</strong>
          <span>今日待複習</span>
        </div>
        <div className="stat">
          <strong>{srsCounts.newOrLearning}</strong>
          <span>新卡 / 學習中</span>
        </div>
        <div className="stat">
          <strong>{accuracy === null ? '—' : `${accuracy}%`}</strong>
          <span>測驗正確率</span>
        </div>
      </section>

      <section className="stats" aria-label="學習進度">
        <div className="stat">
          <strong>{progress.seen.length}</strong>
          <span>已看過</span>
        </div>
        <div className="stat">
          <strong>{progress.mastered.length}</strong>
          <span>已記住</span>
        </div>
        <div className="stat">
          <strong>{Object.keys(progress.srs).length}</strong>
          <span>SRS 卡片</span>
        </div>
      </section>

      <p className="srs-note">間隔重複：答對延後，答錯加快再練</p>

      <nav className="home-nav">
        <button type="button" className="btn primary xl" onClick={startQuiz}>
          開始測驗
          <span className="btn-sub">兩題選擇：名稱 + 效果 · SRS 佇列</span>
        </button>
        <button type="button" className="btn secondary xl" onClick={startReverse}>
          反向測驗
          <span className="btn-sub">給合成裝 · 從 8 件裡選兩件 · SRS 佇列</span>
        </button>
        <button type="button" className="btn secondary xl" onClick={() => setMode('flashcard')}>
          閃卡複習
          <span className="btn-sub">點擊翻面看名稱與效果</span>
        </button>
        <button type="button" className="btn ghost" onClick={resetProgress}>
          重置進度
        </button>
      </nav>

      <footer className="footer">
        <p>僅含經典 8 元件 36 組合 · 不含金鏟鏟／光明／神器</p>
      </footer>
    </div>
  )
}
