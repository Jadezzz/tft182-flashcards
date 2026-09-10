import { useState, type CSSProperties } from 'react'
import type { Component } from '../types'

interface Props {
  component: Component
  size?: 'md' | 'lg'
}

export function ComponentChip({ component, size = 'lg' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const px = size === 'lg' ? 48 : 40

  return (
    <div
      className={`chip chip-${size}`}
      style={{ '--chip-color': component.color } as CSSProperties}
      title={`${component.nameZh} / ${component.nameEn}`}
    >
      {!imgFailed && component.icon ? (
        <img
          className="chip-icon"
          src={component.icon}
          width={px}
          height={px}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="chip-dot" aria-hidden />
      )}
      <span className="chip-name">{component.nameZh}</span>
    </div>
  )
}
