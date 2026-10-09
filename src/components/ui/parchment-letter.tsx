'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SIGNATURE_PATHS } from '@/components/ui/signature-intro'

// Fibrous paper grain: fractal noise, desaturated and tinted warm.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.24 0 0 0 0 0.1 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

function Roller({ edge, open }: { edge: 'top' | 'bottom'; open: boolean }) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-[-14px] z-20 h-7 transition-all duration-[1400ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
      style={{
        [edge]: open ? '-14px' : 'calc(50% - 14px)',
      }}
    >
      {/* the rolled-up paper */}
      <div
        className="absolute inset-y-0 left-3 right-3 rounded-full"
        style={{
          background:
            'linear-gradient(180deg, #6e5130 0%, #c9a971 22%, #f3e3bd 45%, #d9bf8a 62%, #8f6d3f 85%, #4a3418 100%)',
          boxShadow: '0 10px 18px rgba(0,0,0,0.55), inset 0 -2px 3px rgba(0,0,0,0.25)',
        }}
      />
      {/* wooden end knobs */}
      {(['left-0', 'right-0'] as const).map((side) => (
        <div
          key={side}
          className={`absolute ${side} top-1/2 h-9 w-4 -translate-y-1/2 rounded-[6px]`}
          style={{
            background: 'linear-gradient(180deg, #3a2410 0%, #8a5a2b 30%, #c08a4e 48%, #7a4c22 70%, #2a1808 100%)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
          }}
        />
      ))}
    </div>
  )
}

/**
 * A handwritten letter on an aged paper scroll. It sits tilted back in 3-D,
 * leans toward the pointer, and unrolls from the middle the first time it
 * scrolls into view — then the signature writes itself at the bottom.
 */
export function ParchmentLetter({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const sigRef = useRef<SVGGElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(id)
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOpen(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Write the signature once the paper has finished unrolling.
  useEffect(() => {
    const g = sigRef.current
    if (!open || !g) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let at = reduced ? 0 : 1500
    for (const path of Array.from(g.querySelectorAll('path'))) {
      const len = path.getTotalLength()
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = reduced ? '0' : `${len}`
      path.getBoundingClientRect()
      if (!reduced) {
        path.style.transition = `stroke-dashoffset ${Math.round(len * 0.9)}ms cubic-bezier(0.45,0.05,0.35,0.95) ${at}ms`
        path.style.strokeDashoffset = '0'
        at += len * 0.9 + 90
      }
    }
    g.style.visibility = 'visible'
  }, [open])

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return
    const el = tiltRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--ry', `${px * 6}deg`)
    el.style.setProperty('--rx', `${8 - py * 5}deg`)
  }
  const onLeave = () => {
    tiltRef.current?.style.setProperty('--ry', '0deg')
    tiltRef.current?.style.setProperty('--rx', '8deg')
  }

  return (
    <div ref={ref} className="w-full py-6" style={{ perspective: '1400px' }} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div
        ref={tiltRef}
        className="relative mx-auto w-full max-w-xl transition-transform duration-700 ease-out motion-reduce:transition-none"
        style={
          {
            '--rx': '8deg',
            '--ry': '0deg',
            transform: 'rotateX(var(--rx)) rotateY(var(--ry))',
            transformStyle: 'preserve-3d',
          } as React.CSSProperties
        }
      >
        <Roller edge="top" open={open} />
        <Roller edge="bottom" open={open} />

        <div
          className="relative overflow-hidden transition-[clip-path] duration-[1400ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
          style={{
            clipPath: open ? 'inset(0 0 0 0)' : 'inset(49% 0 49% 0)',
            background: [
              // paper curling into the rollers
              'linear-gradient(180deg, rgba(90,60,25,0.38) 0%, transparent 5%, transparent 95%, rgba(90,60,25,0.38) 100%)',
              // age spots and uneven tone
              'radial-gradient(ellipse at 18% 22%, rgba(160,110,50,0.22), transparent 38%)',
              'radial-gradient(ellipse at 82% 70%, rgba(150,100,40,0.2), transparent 40%)',
              'radial-gradient(ellipse at 60% 15%, rgba(255,250,230,0.5), transparent 45%)',
              GRAIN,
              'linear-gradient(180deg, #ecd9ad 0%, #f4e6c4 40%, #ead5a6 100%)',
            ].join(', '),
            boxShadow: 'inset 0 0 70px rgba(110,70,25,0.5), inset 0 0 14px rgba(80,50,15,0.45), 0 30px 60px rgba(0,0,0,0.6)',
          }}
        >
          <div
            className="relative px-7 pb-8 pt-12 text-[#2b1b0c] sm:px-12 sm:pb-10 sm:pt-14"
            style={{ fontFamily: "'Caveat', 'Segoe Script', 'Bradley Hand', cursive" }}
          >
            {children}

            <div className="mt-6 flex flex-col items-end">
              <span className="-rotate-2 text-2xl sm:text-3xl">— William</span>
              <svg viewBox="60 30 850 340" className="-mr-2 mt-1 w-48 -rotate-3 sm:w-60" aria-label="William Lee's signature">
                <g
                  ref={sigRef}
                  style={{ visibility: 'hidden' }}
                  fill="none"
                  stroke="#1c1208"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.88}
                >
                  {SIGNATURE_PATHS.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
