"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion"
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

/** Vertical distance between neighbouring books, in px. */
const SPACING = 168
/** How far one wheel "notch" (100px of deltaY) moves the stack, in books. */
const WHEEL_GAIN = 1 / 320
/** Idle time after the last wheel event before the stack snaps to a book. */
const SNAP_DELAY = 140

/** Signed distance from `index` to `position` on a loop of length n, in [-n/2, n/2). */
function loopDistance(index: number, position: number, n: number) {
  let d = (index - position) % n
  if (d < -n / 2) d += n
  if (d >= n / 2) d -= n
  return d
}

/**
 * The homepage book stack as a drum. One number — `target`, measured in books
 * — is the whole state: wheel, drag, keys and the dots all just move it, and a
 * single spring chases it. Every book's pose is a continuous function of its
 * distance from that spring's value, so all books ride the same curve: they
 * tip back as they rise above center and forward as they fall below, scale
 * and fade with distance, and nothing ever jumps between preset slots.
 */
export function VerticalImageStack({ cards }: VerticalBookStackProps) {
  const n = cards.length
  const target = useMotionValue(0)
  const position = useSpring(target, { stiffness: 170, damping: 26, mass: 0.9 })
  const [active, setActive] = useState(0)

  useMotionValueEvent(position, "change", (p) => {
    const next = ((Math.round(p) % n) + n) % n
    setActive((prev) => (prev === next ? prev : next))
  })

  // Snap after a wheel burst in the direction it travelled: one mouse notch is
  // only ~0.3 books, and rounding to nearest would bounce it back to the start.
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const burstStart = useRef<number | null>(null)
  const scheduleSnap = useCallback(() => {
    if (burstStart.current === null) burstStart.current = Math.round(target.get())
    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = setTimeout(() => {
      const start = burstStart.current ?? Math.round(target.get())
      const moved = target.get() - start
      burstStart.current = null
      if (Math.abs(moved) < 0.08) target.set(start)
      else target.set(start + Math.sign(moved) * Math.max(1, Math.round(Math.abs(moved))))
    }, SNAP_DELAY)
  }, [target])

  const goTo = useCallback(
    (step: number) => target.set(Math.round(target.get()) + step),
    [target],
  )

  // Wheel: accumulate continuously, then settle on the nearest book. Trackpads
  // send many small deltas and mice a few big ones; both just add up.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      const step = Math.max(-0.6, Math.min(0.6, dy * WHEEL_GAIN))
      target.set(target.get() + step)
      scheduleSnap()
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    return () => window.removeEventListener("wheel", onWheel)
  }, [target, scheduleSnap])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") goTo(1)
      if (e.key === "ArrowUp" || e.key === "PageUp") goTo(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goTo])

  // Drag: the stack follows the finger 1:1, then a flick carries it on.
  const drag = useRef<{ y: number; start: number; t: number; v: number; moved: boolean } | null>(null)
  const dragged = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    drag.current = { y: e.clientY, start: target.get(), t: performance.now(), v: 0, moved: false }
    dragged.current = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.y
    if (!d.moved && Math.abs(dy) > 6) {
      d.moved = true
      dragged.current = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    const now = performance.now()
    const next = d.start - dy / SPACING
    d.v = (next - target.get()) / Math.max(1, now - d.t)
    d.t = now
    target.set(next)
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (!d?.moved) return
    // Project the flick ~150ms forward, then land on a whole book.
    target.set(Math.round(target.get() + d.v * 150))
  }

  const openCard = (index: number, e: React.MouseEvent) => {
    if (dragged.current) {
      e.preventDefault()
      return
    }
    // Tapping a neighbour brings it to the front instead of following it.
    const d = loopDistance(index, target.get(), n)
    if (Math.abs(d) > 0.5) {
      e.preventDefault()
      target.set(Math.round(target.get() + d))
    }
  }

  return (
    <div
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-black touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-3xl" />
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-36 bg-gradient-to-b from-black via-black/80 to-transparent" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-44 bg-gradient-to-t from-black via-black/80 to-transparent" />

      <div
        className="relative flex h-[520px] w-full max-w-[320px] items-center justify-center sm:scale-110 lg:scale-[1.22]"
        style={{ perspective: "1100px", transformStyle: "preserve-3d" }}
      >
        {cards.map((card, index) => (
          <BookSlot
            key={card.id}
            card={card}
            index={index}
            count={n}
            position={position}
            isActive={index === active}
            onOpen={(e) => openCard(index, e)}
          />
        ))}
      </div>

      <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:right-8 sm:flex">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => target.set(Math.round(target.get() + loopDistance(index, target.get(), n)))}
            className={`w-2 rounded-full transition-all duration-500 ${
              index === active ? "h-6 bg-white" : "h-2 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Show ${card.label}`}
          />
        ))}
      </div>

      <motion.div
        className="pointer-events-none fixed bottom-28 left-1/2 z-40 -translate-x-1/2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3.2, duration: 0.6 }}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/35">scroll or swipe</span>
      </motion.div>
    </div>
  )
}

function BookSlot({
  card,
  index,
  count,
  position,
  isActive,
  onOpen,
}: {
  card: CardItem
  index: number
  count: number
  position: MotionValue<number>
  isActive: boolean
  onOpen: (e: React.MouseEvent) => void
}) {
  const d = useTransform(position, (p) => loopDistance(index, p, count))
  const y = useTransform(d, (v) => v * SPACING)
  const z = useTransform(d, (v) => -Math.abs(v) * 90)
  const rotateX = useTransform(d, (v) => -v * 22)
  const scale = useTransform(d, (v) => 1 - Math.min(Math.abs(v), 2) * 0.1)
  const opacity = useTransform(d, (v) => Math.max(0, 1 - Math.abs(v) * 0.42 - Math.max(0, Math.abs(v) - 1.4) * 1.2))
  const zIndex = useTransform(d, (v) => 10 - Math.round(Math.abs(v) * 3))
  const brightness = useTransform(d, (v) => `brightness(${1 - Math.min(Math.abs(v), 2) * 0.28})`)

  const external = card.href.startsWith("http")

  return (
    <motion.a
      href={card.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={external ? `${card.label} — opens in a new tab` : card.label}
      tabIndex={isActive ? 0 : -1}
      draggable={false}
      onClick={onOpen}
      className="absolute block cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
      style={{ y, z, rotateX, scale, opacity, zIndex, filter: brightness, transformStyle: "preserve-3d" }}
    >
      <PerspectiveBook size="default" className={card.bookClassName}>
        <div className="flex h-full flex-col justify-between">
          <div>{card.icon}</div>
          <div>
            <BookTitle className="text-sm">{card.label}</BookTitle>
            {card.description && <BookDescription>{card.description}</BookDescription>}
          </div>
        </div>
      </PerspectiveBook>
    </motion.a>
  )
}
