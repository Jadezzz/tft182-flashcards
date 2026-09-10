import { useState, type CSSProperties } from 'react'
import type { Component } from '../types'

interface Props {
  component: Component
  size?: 'md' | 'lg'
  selected?: boolean
  onClick?: () => void
}

export function ComponentChip({
  component,
  size = 'lg',
  selected = false,
  onClick,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const px = size === 'lg' ? 48 : 40
  const className = `chip chip-${size}${selected ? ' chip-selected' : ''}${
    onClick ? ' chip-clickable' : ''
  }`

  const inner = (
    <>
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
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        style={{ '--chip-color': component.color } as CSSProperties}
        title={`${component.nameZh} / ${component.nameEn}`}
        onClick={onClick}
      >
        {inner}
      </button>
    )
  }

  return (
    <div
      className={className}
      style={{ '--chip-color': component.color } as CSSProperties}
      title={`${component.nameZh} / ${component.nameEn}`}
    >
      {inner}
    </div>
  )
}
