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
  'M 210 254 C 226 214, 248 158, 260 130 C 263 123, 266 126, 268 143 C 272 185, 279 234, 286 263 C 288 273, 291 272, 294 256 C 297 236, 301 219, 305 220 C 308 221, 311 243, 314 267 C 316 280, 319 282, 322 270 C 328 226, 337 130, 342 84 C 344 74, 346 74, 348 84 C 352 130, 356 224, 359 264 C 360 276, 362 276, 363 262 C 366 200, 370 92, 373 60 C 374 52, 376 52, 377 62 C 380 130, 383 240, 386 300 C 387 312, 389 312, 390 298 C 393 220, 396 100, 398 68 C 399 60, 401 60, 402 70 C 405 140, 408 230, 410 266 C 411 278, 413 278, 414 264 C 416 220, 419 120, 421 90 C 422 82, 424 82, 425 92 C 427 140, 429 200, 431 244 C 432 258, 434 264, 437 252 C 439 230, 443 212, 447 210 C 450 214, 454 256, 457 296 C 458 306, 461 306, 462 294 C 464 258, 467 230, 470 228 C 473 232, 476 272, 478 306 C 479 316, 481 316, 482 305 C 484 278, 485 258, 487 256 C 490 284, 492 310, 494 322 C 495 330, 497 330, 498 320 C 500 296, 501 280, 503 278 C 506 300, 508 320, 510 330 C 511 337, 513 337, 514 328 C 516 310, 518 298, 520 297 C 523 310, 526 326, 529 334 C 532 340, 536 334, 539 326 C 542 318, 546 322, 549 330 C 553 334, 559 296, 564 260 C 568 238, 571 226, 574 221 C 460 228, 240 240, 94 245 C 88 247, 86 254, 88 263 C 91 276, 94 287, 96 293 C 97 306, 155 318, 275 324 C 395 330, 525 322, 592 312 C 634 305, 658 300, 655 288 C 650 272, 594 264, 532 262 C 424 259, 296 264, 222 269 C 196 271, 172 273, 156 274',
  'M 702 138 C 716 114, 731 88, 740 72 C 736 108, 727 172, 720 222 C 715 252, 711 272, 708 285 C 706 296, 699 301, 692 297 C 688 293, 693 288, 703 286 C 744 277, 806 265, 854 257 C 863 255, 871 246, 876 232',
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
          strokeWidth={4.2}
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
