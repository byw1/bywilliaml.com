'use client'

import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Project {
  /** Display order. 1 is the headline project. */
  rank: number
  /** Product name or domain, used as the card's wordmark. */
  name: string
  /** Only set once it actually serves — a card without href renders as a non-link. */
  href?: string
  /** One or two lines on what it does. Clamped so every card stays the same size. */
  tagline?: string
  status: 'live' | 'building' | 'soon'
  /** Short label overriding the default status pill text, e.g. "iPhone · soon". */
  statusLabel?: string
  /** [from, to] accent stops for the glow, border light and numeral. */
  accent: [string, string]
  /** Square app icon. Falls back to a monogram. */
  icon?: string
  tags?: string[]
}

const TILT_LIMIT = 10

/**
 * One project, as a fixed-aspect 3-D card so a grid of them is perfectly
 * uniform. The card tilts toward the pointer; inside it, layers sit at real
 * depths (icon nearest, copy in the middle, backdrop flat) so they parallax as
 * it turns. The accent glow tracks the pointer, and on hover a light runs
 * around the border. Pointer work writes CSS variables inside one rAF — no
 * React renders while moving.
 */
export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const tiltRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const reduced = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.current = mq.matches
    const onChange = (e: MediaQueryListEvent) => (reduced.current = e.matches)
    mq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  const setVars = useCallback((vars: Record<string, string>) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = tiltRef.current
      if (el) for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v)
      frame.current = null
    })
  }, [])

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (reduced.current || e.pointerType === 'touch') return
      const el = tiltRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      setVars({
        '--rx': `${(0.5 - py) * 2 * TILT_LIMIT}deg`,
        '--ry': `${(px - 0.5) * 2 * TILT_LIMIT}deg`,
        '--gx': `${px * 100}%`,
        '--gy': `${py * 100}%`,
        '--on': '1',
      })
    },
    [setVars],
  )

  const onEnter = useCallback(() => {
    if (!reduced.current) setVars({ '--on': '1' })
  }, [setVars])

  const onLeave = useCallback(
    () => setVars({ '--rx': '0deg', '--ry': '0deg', '--gx': '50%', '--gy': '35%', '--on': '0' }),
    [setVars],
  )

  const [from, to] = project.accent
  const linked = Boolean(project.href)
  const external = project.href?.startsWith('http')
  const pill =
    project.statusLabel ?? (project.status === 'live' ? 'live' : project.status === 'soon' ? 'coming soon' : 'building')

  const inner = (
    <div
      ref={tiltRef}
      className="relative aspect-[5/6] w-full rounded-[28px] transition-transform duration-500 ease-out will-change-transform sm:aspect-[4/5]"
      style={
        {
          '--rx': '0deg',
          '--ry': '0deg',
          '--gx': '50%',
          '--gy': '35%',
          '--on': '0',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(var(--rx)) rotateY(var(--ry))',
        } as React.CSSProperties
      }
    >
      {/* Border light: a rotating conic gradient behind a 1px inset card. */}
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[28px]">
        <div
          className="project-border-light absolute -inset-[40%] transition-opacity duration-500"
          style={{
            opacity: 'calc(0.25 + var(--on) * 0.75)',
            background: `conic-gradient(from 0deg, transparent 0deg, ${from} 50deg, ${to} 100deg, transparent 160deg, transparent 360deg)`,
          }}
        />
      </div>

      {/* Surface */}
      <div className="absolute inset-px overflow-hidden rounded-[27px] bg-[#0b0b0e]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)',
          }}
        />
        <div
          aria-hidden
          className="absolute size-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-[opacity] duration-700"
          style={{
            left: 'var(--gx)',
            top: 'var(--gy)',
            opacity: 'calc(0.35 + var(--on) * 0.25)',
            background: `radial-gradient(circle, ${from}55 0%, ${to}22 30%, transparent 60%)`,
          }}
        />
      </div>

      {/* Content, layered at depth */}
      <div className="relative flex h-full flex-col p-6 sm:p-7" style={{ transformStyle: 'preserve-3d' }}>
        <div className="flex items-start justify-between" style={{ transform: 'translateZ(30px)' }}>
          <span
            className="text-sm font-semibold tabular-nums"
            style={{
              background: `linear-gradient(135deg, ${from}, ${to})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {String(project.rank).padStart(2, '0')}
          </span>
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest backdrop-blur-sm',
              project.status === 'live'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : project.status === 'soon'
                  ? 'border-amber-300/30 bg-amber-300/10 text-amber-200'
                  : 'border-white/10 bg-white/[0.04] text-white/50',
            )}
          >
            {project.status === 'live' && (
              <span className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-emerald-400" />
            )}
            {pill}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center" style={{ transform: 'translateZ(70px)' }}>
          <div className="project-icon-float relative" style={{ animationDelay: `${index * -1.3}s` }}>
            <div
              aria-hidden
              className="absolute inset-x-3 -bottom-6 h-6 rounded-[50%] blur-xl"
              style={{ background: `${from}66` }}
            />
            {project.icon ? (
              <Image
                src={project.icon}
                alt=""
                width={120}
                height={120}
                className="relative size-24 rounded-[24px] shadow-[0_24px_50px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-6 sm:size-28 sm:rounded-[28px]"
              />
            ) : (
              <div
                className="relative grid size-24 place-items-center rounded-[24px] border border-white/10 text-4xl font-bold text-white shadow-[0_24px_50px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-6 sm:size-28 sm:rounded-[28px]"
                style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
              >
                {project.name[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div style={{ transform: 'translateZ(42px)' }}>
          <h2 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            <span className="truncate">{project.name}</span>
            {linked && (
              <ArrowUpRight
                size={18}
                aria-hidden
                className="shrink-0 text-white/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
              />
            )}
          </h2>
          {project.tagline && (
            <p className="mt-1.5 line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-white/55">
              {project.tagline}
            </p>
          )}
          {project.tags && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Glare */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px] transition-opacity duration-500"
        style={{
          opacity: 'var(--on)',
          background: 'radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.10), transparent 40%)',
        }}
      />
    </div>
  )

  const shellClass =
    'group block rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black'
  const shellStyle = {
    perspective: '1100px',
    animation: `project-card-in 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 90}ms both`,
  }
  const handlers = { onPointerEnter: onEnter, onPointerMove: onMove, onPointerLeave: onLeave, onFocus: onEnter, onBlur: onLeave }

  if (!project.href) {
    return (
      <div aria-label={`${project.name} — ${pill}`} className={cn(shellClass, 'cursor-default')} style={shellStyle} {...handlers}>
        {inner}
      </div>
    )
  }
  if (external) {
    return (
      <a
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.name} — opens in a new tab`}
        className={shellClass}
        style={shellStyle}
        {...handlers}
      >
        {inner}
      </a>
    )
  }
  return (
    <Link href={project.href} aria-label={project.name} className={shellClass} style={shellStyle} {...handlers}>
      {inner}
    </Link>
  )
}

/** Dashed slot standing in for the projects still to come — same footprint as a card. */
export function ProjectCardPlaceholder({ index }: { index: number }) {
  return (
    <div
      className="flex aspect-[5/6] w-full flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-white/[0.1] sm:aspect-[4/5]"
      style={{ animation: `project-card-in 700ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 90}ms both` }}
    >
      <span className="grid size-12 place-items-center rounded-2xl border border-white/10 text-xl text-white/30">+</span>
      <p className="text-xs uppercase tracking-widest text-white/30">more soon</p>
    </div>
  )
}
