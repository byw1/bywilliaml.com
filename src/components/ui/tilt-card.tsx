"use client"

import { useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface TiltCardProps {
  tiltLimit?: number
  scale?: number
  perspective?: number
  effect?: "gravitate" | "evade"
  spotlight?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

/**
 * Pointer-tracked 3-D tilt. Transforms are written straight to the node as
 * CSS custom properties inside a single rAF, so a pointer sweep never
 * re-renders React — the jank of the old setState-per-pointermove version.
 * Honors prefers-reduced-motion by staying flat.
 */
export function TiltCard({
  tiltLimit = 8,
  scale = 1.02,
  perspective = 1200,
  effect = "evade",
  spotlight = true,
  className,
  style,
  children,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const reduced = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    reduced.current = mq.matches
    const onChange = (e: MediaQueryListEvent) => {
      reduced.current = e.matches
    }
    mq.addEventListener("change", onChange)
    return () => {
      mq.removeEventListener("change", onChange)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  const dir = effect === "evade" ? -1 : 1

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reduced.current) return
      const el = cardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${(py - 0.5) * (tiltLimit * 2) * dir}deg`)
        el.style.setProperty("--ry", `${(px - 0.5) * -(tiltLimit * 2) * dir}deg`)
        el.style.setProperty("--s", `${scale}`)
        el.style.setProperty("--gx", `${px * 100}%`)
        el.style.setProperty("--gy", `${py * 100}%`)
        frame.current = null
      })
    },
    [tiltLimit, scale, dir]
  )

  const handlePointerEnter = useCallback(() => {
    if (reduced.current) return
    cardRef.current?.style.setProperty("--glow", "1")
  }, [])

  const handlePointerLeave = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
    const el = cardRef.current
    if (!el) return
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--ry", "0deg")
    el.style.setProperty("--s", "1")
    el.style.setProperty("--glow", "0")
  }, [])

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("will-change-transform relative overflow-hidden", className)}
      style={
        {
          "--rx": "0deg",
          "--ry": "0deg",
          "--s": "1",
          "--gx": "50%",
          "--gy": "50%",
          "--glow": "0",
          transform: `perspective(${perspective}px) rotateX(var(--rx)) rotateY(var(--ry)) scale3d(var(--s), var(--s), var(--s))`,
          transition: "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
          ...style,
        } as React.CSSProperties
      }
    >
      {children}
      {spotlight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]"
          style={{ opacity: "var(--glow)", transition: "opacity 0.4s ease" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(420px circle at var(--gx) var(--gy), rgba(255,255,255,0.10) 0%, transparent 55%)",
            }}
          />
        </div>
      )}
    </div>
  )
}
