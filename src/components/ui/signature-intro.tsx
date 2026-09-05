'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * William's actual signature, traced into stroke paths in drawing order:
 * lead-in peak + spike cluster + sawtooth, the long strike-through, the wide
 * under-loop, then the separate right-hand mark and its cross.
 */
const SIGNATURE_PATHS = [
  'M 205 256 C 225 215, 252 155, 261 130 C 265 120, 270 132, 274 168 C 278 205, 283 245, 290 266 C 296 288, 302 292, 306 272 C 314 226, 328 140, 336 98 C 339 84, 343 88, 345 110 C 349 168, 353 235, 356 268 C 358 288, 361 270, 363 220 C 366 150, 369 84, 372 64 C 374 54, 378 60, 380 92 C 383 160, 386 250, 389 305 C 391 322, 394 310, 396 258 C 399 180, 402 104, 405 78 C 407 66, 411 74, 413 104 C 416 160, 419 225, 422 262 C 424 282, 427 272, 429 234 C 432 192, 435 152, 438 128 C 440 114, 444 122, 446 152 C 449 200, 452 252, 455 284 C 457 302, 461 292, 463 254 C 466 220, 469 204, 472 228 C 475 252, 478 292, 482 316 C 485 330, 489 318, 491 284 C 494 256, 497 246, 500 264 C 503 282, 506 312, 510 330 C 514 340, 519 332, 523 316 C 529 296, 537 316, 545 330',
  'M 88 247 C 230 241, 430 229, 575 223',
  'M 545 330 C 585 335, 640 318, 654 298 C 662 284, 640 270, 590 266 C 500 259, 330 264, 220 272 C 150 277, 98 283, 97 296 C 96 312, 160 324, 280 327 C 400 330, 520 322, 588 312 C 606 309, 618 306, 624 303',
  'M 700 142 C 714 118, 730 90, 739 74 C 736 108, 726 170, 719 220 C 714 252, 710 272, 708 282 C 705 296, 697 302, 688 300',
  'M 672 268 C 730 262, 810 257, 858 255 C 868 252, 874 242, 877 232',
]

const MS_PER_PX = 0.3
const PEN_LIFT_MS = 70

export function SignatureIntro() {
  const [phase, setPhase] = useState<'waiting' | 'drawing' | 'leaving' | 'done'>('waiting')
  const groupRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const skip = requestAnimationFrame(() => setPhase('done'))
      return () => cancelAnimationFrame(skip)
    }
    const t = setTimeout(() => setPhase('drawing'), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase === 'drawing') {
      const g = groupRef.current
      if (!g) return
      const paths = Array.from(g.querySelectorAll('path'))
      let at = 150
      for (const path of paths) {
        const length = path.getTotalLength()
        path.style.strokeDasharray = `${length}`
        path.style.strokeDashoffset = `${length}`
        // Commit the hidden dash state before the transition arms, so the
        // stroke draws from zero instead of popping in fully drawn.
        path.getBoundingClientRect()
        path.style.transition = `stroke-dashoffset ${Math.round(length * MS_PER_PX)}ms cubic-bezier(0.45, 0.05, 0.35, 0.95) ${Math.round(at)}ms`
        path.style.strokeDashoffset = '0'
        at += length * MS_PER_PX + PEN_LIFT_MS
      }
      g.style.visibility = 'visible'
      const leave = setTimeout(() => setPhase('leaving'), at + 350)
      return () => clearTimeout(leave)
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
      <svg viewBox="60 30 850 340" className="w-[min(80vw,520px)]">
        <g
          ref={groupRef}
          style={{ visibility: 'hidden' }}
          fill="none"
          stroke="#ffffff"
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {SIGNATURE_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
    </div>
  )
}
