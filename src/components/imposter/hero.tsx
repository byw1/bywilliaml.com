'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { GithubMark } from '@/components/charades/github-mark'
import { ShadeSticker } from './shade-sticker'
import { AppStoreButton } from './app-store-button'
import { GITHUB_URL } from './data'
import type { MascotMood } from './shade-face'

const WHISPERS = ['Too obvious!', 'Sus.', 'One word.', 'It was you.', 'Wait, what?', 'Vote!']
const POKES: { mood: MascotMood; line: string }[] = [
  { mood: 'gasp', line: 'Me?!' },
  { mood: 'caught', line: 'It wasn’t me' },
  { mood: 'wink', line: 'Shh' },
  { mood: 'excited', line: 'Hehe' },
]

/**
 * Shade, big. Its eyes follow the pointer round the table, it gives a shifty
 * look every few seconds, and a poke gets a reaction, like the app.
 */
function LiveShade() {
  const reduced = useReducedMotion()
  const root = useRef<HTMLButtonElement>(null)
  const [look, setLook] = useState(0)
  const [peeking, setPeeking] = useState(false)
  const [blinking, setBlinking] = useState(false)
  const [poke, setPoke] = useState<{ n: number; mood: MascotMood; line: string } | null>(null)

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      const el = root.current
      if (!el) return
      const box = el.getBoundingClientRect()
      const dx = e.clientX - (box.left + box.width / 2)
      setLook(Math.abs(dx) < box.width * 0.35 ? 0 : Math.sign(dx))
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced])

  useEffect(() => {
    if (reduced) return
    let t: number
    const blink = () => {
      t = window.setTimeout(() => {
        setBlinking(true)
        t = window.setTimeout(() => {
          setBlinking(false)
          blink()
        }, 130)
      }, 2400 + Math.random() * 2600)
    }
    blink()
    return () => window.clearTimeout(t)
  }, [reduced])

  useEffect(() => {
    if (reduced) return
    let t: number
    const peek = () => {
      t = window.setTimeout(() => {
        setPeeking(true)
        t = window.setTimeout(() => {
          setPeeking(false)
          peek()
        }, 1500)
      }, 2600 + Math.random() * 3000)
    }
    peek()
    return () => window.clearTimeout(t)
  }, [reduced])

  useEffect(() => {
    if (!poke) return
    const t = window.setTimeout(() => setPoke(null), 1300)
    return () => window.clearTimeout(t)
  }, [poke])

  const mood: MascotMood = poke ? poke.mood : peeking ? 'peek' : 'smirk'

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.button
        ref={root}
        type="button"
        aria-label="Poke Shade"
        onClick={() => setPoke((p) => ({ n: (p?.n ?? 0) + 1, ...POKES[(p?.n ?? Math.floor(Math.random() * 4)) % POKES.length] }))}
        whileTap={reduced ? undefined : { scale: 0.9, rotate: -6 }}
        animate={poke && !reduced ? { scale: [1, 1.14, 1], rotate: [0, 8, 0] } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 10 }}
        className="relative rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--im-blue)]"
      >
        <ShadeSticker size={280} mood={mood} look={look} blinking={blinking && !poke} bounce className="drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]" />
      </motion.button>
      {poke ? (
        <motion.p
          key={poke.n}
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], y: -30, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="im-display pointer-events-none absolute left-1/2 top-[8%] -translate-x-1/2 text-2xl text-[var(--im-lime)]"
        >
          {poke.line}
        </motion.p>
      ) : null}
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden pt-24">
      <div aria-hidden className="im-hero-glow pointer-events-none absolute inset-0" />
      <div aria-hidden className="im-bars pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 text-center sm:px-6">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="im-chip">
          <span className="size-2 rounded-full bg-[var(--im-lime)] shadow-[0_0_12px_var(--im-lime)]" />
          Free · offline · no ads · no accounts
        </motion.p>

        <h1 className="im-display mt-6 text-[clamp(2.7rem,8.5vw,7rem)] leading-[0.9] tracking-[-0.04em]">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
          >
            One of you <span className="im-censor">is lying.</span>
          </motion.span>
          <motion.span
            className="relative mt-3 inline-block sm:mt-4"
            initial={{ opacity: 0, y: 40, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.22 }}
          >
            <span className="im-sticker-text">Find them.</span>
          </motion.span>
        </h1>

        <div className="relative my-2 h-[min(46vh,400px)] w-screen">
          <LiveShade />
          {/* Whispers round the table, popping in around Shade. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-4xl -translate-x-1/2">
            {WHISPERS.map((w, i) => (
              <span key={w} className="im-whisper" style={{ ['--i' as string]: i }}>
                {w}
              </span>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="relative z-10 max-w-xl text-balance text-base text-white/70 sm:text-lg"
        >
          Everyone gets the secret word, except the imposter. Pass one phone round the table, give one-word
          clues, argue, and vote. For 3 to 12 players, and 600 words free from the start.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <AppStoreButton />
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="im-btn im-btn-glass">
            <GithubMark />
            Source on GitHub
          </a>
        </motion.div>

        <p className="relative z-10 mt-4 text-xs text-white/40">Tip: poke Shade.</p>

        <a href="#how" className="relative z-10 mb-8 mt-auto pt-10 text-white/40 transition hover:text-white" aria-label="How it works">
          <ArrowDown className="animate-bounce" size={22} />
        </a>
      </div>
    </section>
  )
}
