import type { Component, ComponentId } from '../types'
import { ComponentChip } from './ComponentChip'

interface Props {
  a: ComponentId
  b: ComponentId
  map: Record<ComponentId, Component>
}

export function RecipePair({ a, b, map }: Props) {
  return (
    <div className="recipe-pair" aria-label="合成元件">
      <ComponentChip component={map[a]} />
      <span className="plus" aria-hidden>
        +
      </span>
      <ComponentChip component={map[b]} />
    </div>
  )
}
