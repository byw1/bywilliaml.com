"use client"

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { motion, type PanInfo } from "framer-motion"
import { PerspectiveBook, BookTitle, BookDescription } from "@/components/ui/perspective-book"

export interface CardItem {
  id: number
  label: string
  href: string
  description?: string
  bookClassName?: string
  icon?: ReactNode
}

interface VerticalBookStackProps {
  cards: CardItem[]
}

export function VerticalImageStack({ cards }: VerticalBookStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const lastNavigationTime = useRef(0)
  const isDragging = useRef(false)
  const navigationCooldown = 400

  const navigate = useCallback((newDirection: number) => {
    const now = Date.now()
    if (now - lastNavigationTime.current < navigationCooldown) return
    lastNavigationTime.current = now

    setCurrentIndex((prev) => {
      if (newDirection > 0) {
        return prev === cards.length - 1 ? 0 : prev + 1
      }
      return prev === 0 ? cards.length - 1 : prev - 1
    })
  }, [cards.length])

  const handleDragStart = () => {
    isDragging.current = true
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.y < -threshold) {
      navigate(1)
    } else if (info.offset.y > threshold) {
      navigate(-1)
    }
    setTimeout(() => { isDragging.current = false }, 50)
  }

  const handleCardClick = (href: string) => {
    if (isDragging.current) return
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer")
    } else {
      window.location.href = href
    }
  }

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          navigate(1)
        } else {
          navigate(-1)
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: true })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  const getCardStyle = (index: number) => {
    const total = cards.length
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 }
    } else if (diff === -1) {
      return { y: -160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 }
    } else if (diff === -2) {
      return { y: -280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 }
    } else if (diff === 1) {
      return { y: 160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 }
    } else if (diff === 2) {
      return { y: 280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 }
    } else {
      return { y: diff > 0 ? 400 : -400, scale: 0.6, opacity: 0, zIndex: 0, rotateX: diff > 0 ? -20 : 20 }
    }
  }

  const isVisible = (index: number) => {
    const total = cards.length
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return Math.abs(diff) <= 2
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-3xl" />
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-32 bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-40 bg-gradient-to-t from-black to-transparent" />

      <div className="relative flex h-[500px] w-[320px] items-center justify-center" style={{ perspective: "1200px" }}>
        {cards.map((card, index) => {
          if (!isVisible(index)) return null
          const style = getCardStyle(index)
          const isCurrent = index === currentIndex

          return (
            <motion.div
              key={card.id}
              className="absolute cursor-grab active:cursor-grabbing"
              animate={{
                y: style.y,
                scale: style.scale,
                opacity: style.opacity,
                rotateX: style.rotateX,
                zIndex: style.zIndex,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 1,
              }}
              drag={isCurrent ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onClick={() => isCurrent && handleCardClick(card.href)}
              style={{
                transformStyle: "preserve-3d",
                zIndex: style.zIndex,
              }}
            >
              <PerspectiveBook size="default" className={card.bookClassName}>
                <div className="flex flex-col h-full justify-between">
                  <div>{card.icon}</div>
                  <div>
                    <BookTitle className="text-sm">{card.label}</BookTitle>
                    {card.description && (
                      <BookDescription>{card.description}</BookDescription>
                    )}
                  </div>
                </div>
              </PerspectiveBook>
            </motion.div>
          )
        })}
      </div>

      <div className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (index !== currentIndex) {
                setCurrentIndex(index)
              }
            }}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "h-6 bg-white" : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      <motion.div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <span className="text-xs font-medium tracking-widest text-white/40">scroll or drag</span>
      </motion.div>
    </div>
  )
}
