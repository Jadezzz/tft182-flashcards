import type { CSSProperties } from 'react'
import type { Component } from '../types'

interface Props {
  component: Component
  size?: 'md' | 'lg'
}

export function ComponentChip({ component, size = 'lg' }: Props) {
  return (
    <div
      className={`chip chip-${size}`}
      style={{ '--chip-color': component.color } as CSSProperties}
      title={`${component.nameZh} / ${component.nameEn}`}
    >
      <span className="chip-dot" aria-hidden />
      <span className="chip-name">{component.nameZh}</span>
    </div>
  )
}
