'use client'

import { useEffect, useState } from 'react'

const LETTERS = ['W', 'i', 'l', 'l', 'i', 'a', 'm']

/**
 * Full-screen intro that hand-draws "William" like a signature, then fades
 * out. Each letter is a tspan whose outline is traced with a staggered
 * stroke-dashoffset animation (styles in globals.css), so the effect uses the
 * real Caveat webfont instead of hand-authored paths.
 *
 * Phases: waiting (font loading, black screen) -> drawing -> leaving (fade,
 * clicks pass through) -> done (unmounted). Reduced-motion skips it entirely.
 */
export function SignatureIntro() {
  const [phase, setPhase] = useState<'waiting' | 'drawing' | 'leaving' | 'done'>('waiting')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const skip = requestAnimationFrame(() => setPhase('done'))
      return () => cancelAnimationFrame(skip)
    }
    let cancelled = false
    const start = () => {
      if (!cancelled) setPhase((p) => (p === 'waiting' ? 'drawing' : p))
    }
    // Draw once Caveat is ready so the strokes match the final glyphs; the
    // timeout keeps the page from hiding behind a stalled font request.
    const fallback = setTimeout(start, 700)
    document.fonts
      ?.load("700 110px 'Caveat'")
      .then(() => {
        clearTimeout(fallback)
        start()
      })
      .catch(() => {})
    return () => {
      cancelled = true
      clearTimeout(fallback)
    }
  }, [])

  // One timer per phase: scheduling both from 'drawing' would let the
  // drawing->leaving re-run's cleanup cancel the final unmount timer.
  useEffect(() => {
    if (phase === 'drawing') {
      const t = setTimeout(() => setPhase('leaving'), 2100)
      return () => clearTimeout(t)
    }
    if (phase === 'leaving') {
      const t = setTimeout(() => setPhase('done'), 550)
      return () => clearTimeout(t)
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ${
        phase === 'leaving' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <svg
        viewBox="0 0 560 200"
        className={`w-[min(78vw,460px)] ${phase !== 'waiting' ? 'signature-ready' : ''}`}
      >
        <text x="280" y="130" textAnchor="middle" className="signature-text">
          {LETTERS.map((letter, i) => (
            <tspan
              key={`${letter}-${i}`}
              className="signature-letter"
              style={{ '--sd': `${i * 0.14}s` } as React.CSSProperties}
            >
              {letter}
            </tspan>
          ))}
        </text>
      </svg>
    </div>
  )
}
