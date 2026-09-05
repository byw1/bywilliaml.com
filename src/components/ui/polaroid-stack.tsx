'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, type PanInfo } from 'framer-motion'

export interface PolaroidItem {
  src: string
  caption?: string
  alt?: string
}

interface Card extends PolaroidItem {
  id: number
  zIndex: number
}

interface PolaroidStackProps {
  items: PolaroidItem[]
  className?: string
}

export default function PolaroidStack({ items, className = '' }: PolaroidStackProps) {
  const [cards, setCards] = useState<Card[]>(
    items.map((item, index) => ({
      ...item,
      id: index,
      zIndex: 50 - index * 10,
    })),
  )
  const [isAnimating, setIsAnimating] = useState(false)
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const minDragDistance = 50

  const getCardStyles = (index: number) => {
    const baseRotation = 3
    const rotationIncrement = 4
    const offsetIncrement = -10
    const verticalOffset = -6

    return {
      x: index * offsetIncrement,
      y: index * verticalOffset,
      rotate: index === 0 ? 0 : -(baseRotation + index * rotationIncrement),
      scale: 1,
      transition: { duration: 0.5 },
    }
  }

  const handleDragStart = (_: unknown, info: PanInfo) => {
    dragStartPos.current = { x: info.point.x, y: info.point.y }
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const dragDistance = Math.sqrt(
      Math.pow(info.point.x - dragStartPos.current.x, 2) +
        Math.pow(info.point.y - dragStartPos.current.y, 2),
    )

    if (isAnimating) return
    if (dragDistance < minDragDistance) return

    setIsAnimating(true)
    setCards((prevCards) => {
      const newCards = [...prevCards]
      const cardToMove = newCards.shift()!
      newCards.push(cardToMove)
      return newCards.map((card, index) => ({
        ...card,
        zIndex: 50 - index * 10,
      }))
    })
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <div className={`relative flex items-center justify-center w-full max-w-80 h-[420px] ${className}`}>
      {cards.map((card, index) => {
        const isTopCard = index === 0
        const cardStyles = getCardStyles(index)
        const canDrag = isTopCard && !isAnimating
        const captionTilt = ((card.id * 37) % 7) - 3

        return (
          <motion.div
            key={card.id}
            className="absolute w-60 origin-bottom cursor-grab active:cursor-grabbing flex flex-col"
            style={{
              zIndex: card.zIndex,
              aspectRatio: '5/6',
              background: '#f9f5ea',
              padding: '12px 12px 0 12px',
              boxShadow:
                '0 1px 1px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.4), 0 30px 40px -20px rgba(0,0,0,0.5)',
            }}
            animate={cardStyles}
            drag={canDrag}
            dragElastic={0.2}
            dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
            dragSnapToOrigin={true}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileHover={
              isTopCard
                ? { scale: 1.04, transition: { duration: 0.2 } }
                : {}
            }
            whileDrag={{
              scale: 1.08,
              rotate: 0,
              zIndex: 100,
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
              transition: { duration: 0.1 },
            }}
          >
            <div className="relative w-full aspect-square bg-neutral-200 flex-shrink-0">
              <Image
                src={card.src}
                alt={card.alt || card.caption || ''}
                fill
                className="object-cover pointer-events-none select-none"
                sizes="240px"
                draggable={false}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: 'inset 0 0 24px rgba(0,0,0,0.18)' }}
              />
            </div>

            {/* The classic blank polaroid chin — caption only if one is given */}
            <div className="flex-1 flex items-center justify-center px-2 py-2">
              {card.caption && (
                <span
                  className="text-neutral-700 leading-tight text-center"
                  style={{
                    fontFamily: "'Fuzzy Bubbles', cursive",
                    fontSize: '20px',
                    fontWeight: 700,
                    transform: `rotate(${captionTilt}deg)`,
                  }}
                >
                  {card.caption}
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
