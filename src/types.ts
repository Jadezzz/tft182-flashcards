export type ComponentId =
  | 'bf_sword'
  | 'recurve_bow'
  | 'nl_rod'
  | 'tear'
  | 'chain_vest'
  | 'negatron'
  | 'giants_belt'
  | 'sparring_gloves'

export interface Component {
  id: ComponentId
  nameZh: string
  nameEn: string
  color: string
  icon: string
}

export interface Item {
  id: string
  nameZh: string
  nameEn: string
  components: [ComponentId, ComponentId]
  effect: string
  icon: string
}

export interface ItemsData {
  patch: string
  set: number
  components: Component[]
  items: Item[]
}

export type Mode = 'home' | 'quiz' | 'flashcard' | 'reverse'

export interface ProgressState {
  seen: string[]
  mastered: string[]
  quizCorrect: number
  quizTotal: number
}
