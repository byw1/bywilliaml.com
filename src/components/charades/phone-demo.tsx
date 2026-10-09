'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DECKS, palette, textOn } from './data'

type Outcome = 'correct' | 'pass'

const LINES = {
  correct: ['Got it', 'Yesss', 'Nailed it', 'Easy', 'Big brain'],
  pass: ['Pass', 'Next', 'Skip'],
} as const

const POOL = DECKS.flatMap((deck) => deck.cards.slice(0, 6).map((text) => ({ text, color: deck.color, emoji: deck.emoji, deck: deck.name })))
const ROUND_SECONDS = 30

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * The round, in a phone you can play. It runs itself until you touch it:
 * then it is your round, thirty seconds, tip down for got it, up to pass,
 * exactly like the app. Arrow keys work too.
 */
export function PhoneDemo() {
  const [deck, setDeck] = useState(POOL)
  const [index, setIndex] = useState(0)
  const [flash, setFlash] = useState<{ outcome: Outcome; line: string; key: number } | null>(null)
  const [tilt, setTilt] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [left, setLeft] = useState(ROUND_SECONDS)
  const [score, setScore] = useState({ correct: 0, pass: 0 })
  const [done, setDone] = useState(false)
  const busy = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const answer = useCallback(
    (outcome: Outcome) => {
      if (busy.current || done) return
      busy.current = true
      setTilt(outcome === 'correct' ? 1 : -1)
      const lines = LINES[outcome]
      setFlash({ outcome, line: lines[Math.floor(Math.random() * lines.length)], key: Date.now() })
      setScore((s) => ({ ...s, [outcome]: s[outcome] + 1 }))
      window.setTimeout(() => setTilt(0), 260)
      window.setTimeout(() => {
        setFlash(null)
        setIndex((i) => (i + 1) % deck.length)
        busy.current = false
      }, 520)
    },
    [deck.length, done],
  )

  const start = useCallback(() => {
    setPlaying(true)
    setDone(false)
    setLeft(ROUND_SECONDS)
    setScore({ correct: 0, pass: 0 })
    setDeck(shuffled(POOL))
    setIndex(0)
  }, [])

  const play = useCallback(
    (outcome: Outcome) => {
      if (!playing) {
        start()
        return
      }
      answer(outcome)
    },
    [answer, playing, start],
  )

  // The demo plays itself while nobody is playing.
  useEffect(() => {
    if (playing || !inView) return
    const id = window.setInterval(() => answer(Math.random() < 0.72 ? 'correct' : 'pass'), 1900)
    return () => window.clearInterval(id)
  }, [answer, inView, playing])

  useEffect(() => {
    if (!playing || done) return
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setDone(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [done, playing])

  useEffect(() => {
    if (!inView) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        play('correct')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        play('pass')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView, play])

  const card = deck[index]
  const fg = textOn(card.color)
  const flashColor = flash?.outcome === 'correct' ? palette.green : palette.orange

  return (
    <div ref={root} className="flex flex-col items-center">
      <div className="relative w-full max-w-[560px] [perspective:1400px]">
        <motion.div
          animate={{ rotateX: tilt * -28, y: tilt * 14 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="cr-phone relative aspect-[19.5/9] w-full"
        >
          <div className="absolute inset-[3.2%] overflow-hidden rounded-[7%/15%]" style={{ background: card.color }}>
            {/* Timer bar, like the round screen. */}
            <div className="absolute inset-x-[6%] top-[7%] h-[3.5%] overflow-hidden rounded-full" style={{ background: `${fg}26` }}>
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                style={{ width: `${playing ? (left / ROUND_SECONDS) * 100 : 100}%`, background: fg }}
              />
            </div>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${index}-${card.text}`}
                initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute inset-0 flex flex-col items-center justify-center px-[8%] text-center"
                style={{ color: fg }}
              >
                <span className="cr-display text-[clamp(1.6rem,7vw,3.4rem)] leading-[0.95] tracking-[-0.03em]">{card.text}</span>
                <span className="mt-2 text-[clamp(0.6rem,1.8vw,0.8rem)] font-bold uppercase tracking-[0.18em] opacity-70">
                  {card.emoji} {card.deck}
                </span>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {flash ? (
                <motion.div
                  key={flash.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: flashColor }}
                >
                  <motion.div
                    initial={{ scale: 1.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                    style={{ rotate: flash.outcome === 'correct' ? -5 : 4 }}
                    className="flex flex-col items-center text-[#0A0A0D]"
                  >
                    <span className="text-[clamp(1.6rem,6vw,3rem)]">{flash.outcome === 'correct' ? '🔥' : '💨'}</span>
                    <span className="cr-display text-[clamp(2rem,8vw,4rem)] leading-none">{flash.line}</span>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {done ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0D]/92 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Time&apos;s up</span>
                <span className="cr-display mt-1 text-[clamp(2rem,7vw,3.5rem)] leading-none text-[var(--cr-yellow)]">
                  {score.correct} got
                </span>
                <span className="mt-1 text-sm text-white/60">
                  {score.pass} passed ·{' '}
                  {score.correct >= 12 ? 'MVP energy.' : score.correct >= 7 ? 'Solid round.' : 'The room was not helping.'}
                </span>
              </div>
            ) : null}
          </div>
          <div aria-hidden className="absolute left-[1.3%] top-1/2 h-[26%] w-[1.6%] -translate-y-1/2 rounded-full bg-black" />
        </motion.div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => play('pass')} className="cr-btn cr-btn-pass">
          ↑ Tip up · Pass
        </button>
        <button type="button" onClick={() => play('correct')} className="cr-btn cr-btn-correct">
          ↓ Tip down · Got it
        </button>
      </div>
      <p className="mt-4 h-5 text-center text-sm text-white/50" aria-live="polite">
        {done ? (
          <button type="button" className="underline decoration-white/30 underline-offset-4 hover:text-white" onClick={start}>
            Play again
          </button>
        ) : playing ? (
          `${left}s · ${score.correct} got · ${score.pass} passed`
        ) : (
          'Press a button or an arrow key to play a 30-second round.'
        )}
      </p>
    </div>
  )
}
