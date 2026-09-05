'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * William's actual signature, traced against the reference image and matched
 * to his real pen flow: stroke one is the whole left side in a single motion
 * (W, the illi spikes, the am sawtooth, rising into the strike-through drawn
 * right-to-left, then diving into the wide under-loop); the only pen lift in
 * the signature comes before stroke two, the cursive L.
 */
const SIGNATURE_PATHS = [
  'M 203 260 C 220 220, 246 160, 257 133 C 261 122, 266 130, 269 160 C 273 198, 279 238, 285 261 C 288 274, 292 273, 295 254 C 298 234, 302 216, 306 225 C 309 233, 313 257, 317 273 C 320 285, 324 280, 327 258 C 331 220, 336 150, 340 110 C 342 96, 346 98, 348 118 C 351 170, 355 235, 358 269 C 360 288, 363 268, 365 216 C 368 146, 371 82, 374 62 C 376 52, 380 58, 382 90 C 385 158, 388 248, 391 303 C 393 320, 396 308, 398 256 C 401 178, 404 102, 407 74 C 409 62, 413 70, 415 100 C 418 158, 421 224, 424 262 C 426 282, 429 272, 431 234 C 434 196, 437 158, 440 134 C 442 120, 446 128, 448 158 C 451 204, 454 254, 457 286 C 459 304, 463 294, 465 256 C 468 222, 471 206, 474 230 C 477 254, 480 294, 484 318 C 487 332, 491 320, 493 286 C 496 258, 499 248, 502 266 C 505 284, 508 314, 512 331 C 515 340, 519 336, 523 324 C 531 296, 543 258, 554 237 C 560 227, 567 222, 573 221 C 470 228, 250 240, 96 246 C 89 248, 87 254, 89 264 C 92 277, 95 287, 97 293 C 97 305, 150 317, 270 323 C 390 329, 520 323, 590 313 C 632 306, 657 300, 654 289 C 649 273, 596 265, 536 263 C 428 260, 298 265, 224 270 C 202 272, 186 272, 176 271',
  'M 700 142 C 714 118, 730 90, 739 74 C 735 110, 725 175, 718 225 C 713 255, 709 275, 707 286 C 705 295, 698 300, 691 296 C 687 292, 693 287, 704 285 C 742 277, 800 266, 852 259 C 862 257, 870 247, 874 235',
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
