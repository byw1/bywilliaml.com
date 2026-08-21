'use client'

import { useCallback, useEffect, useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Project {
  /** Display order. 1 is the headline project. */
  rank: number
  /** The domain, used as the card's wordmark. */
  name: string
  /** Only set once the site actually serves — a card without href renders as a non-link. */
  href?: string
  /** One line on what it does. Omitted renders nothing rather than a placeholder. */
  tagline?: string
  status: 'live' | 'building'
  /** [from, to] gradient stops for the card's glow and rank numeral. */
  accent: [string, string]
}

const TILT_LIMIT = 12
const LIFT = 44

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const tiltRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const reduced = useRef(false)

  const resetTilt = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--lift', '0px')
    el.style.setProperty('--glare', '0')
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.current = mq.matches
    const onChange = (e: MediaQueryListEvent) => {
      reduced.current = e.matches
      if (e.matches) resetTilt()
    }
    mq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [resetTilt])

  /**
   * Writes transforms straight to the node as CSS custom properties. No React
   * state, so a pointer sweep never re-renders the tree, and the work is
   * coalesced into one frame.
   */
  const applyTilt = useCallback((xRot: number, yRot: number, gx: number, gy: number) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = tiltRef.current
      if (!el) return
      el.style.setProperty('--rx', `${xRot}deg`)
      el.style.setProperty('--ry', `${yRot}deg`)
      el.style.setProperty('--gx', `${gx}%`)
      el.style.setProperty('--gy', `${gy}%`)
      frame.current = null
    })
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reduced.current) return
      const el = tiltRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      applyTilt((py - 0.5) * -2 * TILT_LIMIT, (px - 0.5) * 2 * TILT_LIMIT, px * 100, py * 100)
    },
    [applyTilt]
  )

  const engage = useCallback(() => {
    if (reduced.current) return
    const el = tiltRef.current
    if (!el) return
    el.style.setProperty('--lift', `${LIFT}px`)
    el.style.setProperty('--glare', '1')
  }, [])

  const [from, to] = project.accent
  const isLive = project.status === 'live' && Boolean(project.href)
  const Tag = isLive ? 'a' : 'div'

  return (
    <Tag
      {...(isLive
        ? { href: project.href, target: '_blank', rel: 'noopener noreferrer' }
        : {})}
      aria-label={
        isLive
          ? `${project.name} — opens in a new tab`
          : `${project.name} — in development`
      }
      onPointerEnter={engage}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onFocus={engage}
      onBlur={resetTilt}
      className={cn(
        'group block rounded-3xl outline-none',
        'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black',
        isLive ? 'cursor-pointer' : 'cursor-default'
      )}
      style={{
        perspective: '1100px',
        // Staggered entrance, driven by CSS so it costs no JS.
        animation: `project-card-in 640ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 90}ms both`,
      }}
    >
      <div
        ref={tiltRef}
        className="relative aspect-[3/2] w-full rounded-3xl transition-transform duration-300 ease-out will-change-transform"
        style={
          {
            '--rx': '0deg',
            '--ry': '0deg',
            '--gx': '50%',
            '--gy': '50%',
            '--lift': '0px',
            '--glare': '0',
            transformStyle: 'preserve-3d',
            transform: 'rotateX(var(--rx)) rotateY(var(--ry))',
          } as React.CSSProperties
        }
      >
        {/* Surface. Flat and clipped, so overflow never flattens the 3-D context above it. */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04]">
          <div
            className="absolute -bottom-1/3 left-1/2 h-[130%] w-[130%] -translate-x-1/2 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
            style={{ background: `radial-gradient(circle, ${from} 0%, transparent 62%)` }}
          />
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${to}66, transparent)` }}
          />
        </div>

        {/* Content, lifted off the surface so it parallaxes against it as the card tilts. */}
        <div
          className="relative flex h-full flex-col justify-between p-6 transition-transform duration-300 ease-out"
          style={{ transform: 'translateZ(var(--lift))' }}
        >
          <div className="flex items-start justify-between">
            <span
              className="text-5xl font-bold leading-none tracking-tight"
              style={{
                background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {String(project.rank).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest',
                project.status === 'live'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-white/10 bg-white/[0.04] text-white/40'
              )}
            >
              {project.status === 'live' ? 'live' : 'building'}
            </span>
          </div>

          <div>
            <h2 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              <span className="break-all">{project.name}</span>
              {isLive && (
                <ArrowUpRight
                  size={18}
                  className="shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                  aria-hidden="true"
                />
              )}
            </h2>
            {project.tagline && (
              <p className="mt-1.5 text-sm leading-relaxed text-white/50">{project.tagline}</p>
            )}
          </div>
        </div>

        {/* Glare, tracking the pointer. Sits above everything and eats no clicks. */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl transition-opacity duration-300"
          style={{ opacity: 'var(--glare)' }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.16) 0%, transparent 45%)',
            }}
          />
        </div>
      </div>
    </Tag>
  )
}

/** Dashed slot standing in for the projects still to come. */
export function ProjectCardPlaceholder({ index }: { index: number }) {
  return (
    <div
      className="flex aspect-[3/2] w-full items-center justify-center rounded-3xl border border-dashed border-white/[0.09]"
      style={{
        animation: `project-card-in 640ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 90}ms both`,
      }}
    >
      <p className="text-xs uppercase tracking-widest text-white/25">more soon</p>
    </div>
  )
}
