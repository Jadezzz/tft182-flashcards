import { useState } from 'react'
import type { Item } from '../types'

interface Props {
  item: Item
  size?: number
  className?: string
}

export function ItemIcon({ item, size = 64, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed || !item.icon) return null
  return (
    <img
      className={`item-icon ${className}`.trim()}
      src={item.icon}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
