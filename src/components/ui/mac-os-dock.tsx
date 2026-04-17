'use client'

import React, { useState, useRef, useCallback } from 'react'

interface DockItem {
  id: string
  name: string
  icon: React.ReactNode
  href: string
}

interface MacOSDockProps {
  items: DockItem[]
  className?: string
}

const BASE_SIZE = 48
const MAX_SIZE = 72
const EFFECT_DISTANCE = 140

const MacOSDock: React.FC<MacOSDockProps> = ({ items, className = '' }) => {
  const [sizes, setSizes] = useState<number[]>(items.map(() => BASE_SIZE))
  const dockRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dockRef.current) return
      const rect = dockRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left

      const newSizes = items.map((_, index) => {
        const iconCenter =
          (rect.width / items.length) * index +
          rect.width / items.length / 2
        const distance = Math.abs(mouseX - iconCenter)

        if (distance > EFFECT_DISTANCE) return BASE_SIZE
        const scale = Math.cos((distance / EFFECT_DISTANCE) * (Math.PI / 2))
        return BASE_SIZE + (MAX_SIZE - BASE_SIZE) * scale
      })
      setSizes(newSizes)
    },
    [items],
  )

  const handleMouseLeave = useCallback(() => {
    setSizes(items.map(() => BASE_SIZE))
  }, [items])

  const handleClick = (item: DockItem) => {
    if (item.href.startsWith('http') || item.href.startsWith('mailto:')) {
      window.open(item.href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = item.href
    }
  }

  return (
    <div
      ref={dockRef}
      className={`flex items-end gap-[6px] backdrop-blur-xl ${className}`}
      style={{
        padding: '8px 10px',
        background: 'rgba(30, 30, 30, 0.7)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="cursor-pointer"
          title={item.name}
          onClick={() => handleClick(item)}
          style={{
            width: `${sizes[index]}px`,
            height: `${sizes[index]}px`,
            transition: 'width 0.15s ease-out, height 0.15s ease-out',
            filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.25))`,
          }}
        >
          <div className="w-full h-full">{item.icon}</div>
        </div>
      ))}
    </div>
  )
}

export { MacOSDock }
export type { DockItem }
