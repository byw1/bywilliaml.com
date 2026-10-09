'use client'

import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { GithubMark } from './github-mark'
import { DexSticker } from './dex-sticker'
import { AppStoreButton } from './app-store-button'
import { GITHUB_URL } from './data'

// three and drei are a big bundle and touch the browser on import, so the
// scene loads only in the browser, after the page has decided it wants motion.
const DexScene = dynamic(() => import('./dex-scene'), { ssr: false, loading: () => <StickerFallback /> })

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error('Dex scene failed to render', error)
  }
  render() {
    return this.state.failed ? <StickerFallback /> : this.props.children
  }
}

function StickerFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <DexSticker size={260} bounce />
    </div>
  )
}

const SHOUTS = ['Got it!', 'Pass!', 'Hum it!', 'No talking!', '3 seconds!', 'Act it out!']

export function Hero() {
  const section = useRef<HTMLElement>(null)
  const [mode, setMode] = useState<'pending' | '3d' | 'flat'>('pending')
  const [visible, setVisible] = useState(true)
  const [fonts, setFonts] = useState<{ display: string; body: string } | null>(null)
  const [pokes, setPokes] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = document.createElement('canvas')
    const webgl = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
    const el = section.current
    const styles = el ? getComputedStyle(el) : null
    const display = styles?.getPropertyValue('--font-display').trim() || 'system-ui'
    const body = styles?.getPropertyValue('--font-body').trim() || 'system-ui'
    // Canvas text draws with whatever is loaded right now, so wait for the face.
    void Promise.all([document.fonts.load(`800 100px ${display}`), document.fonts.load(`700 30px ${body}`)])
      .catch(() => undefined)
      .then(() => {
        setFonts({ display, body })
        setMode(reduced || !webgl ? 'flat' : '3d')
      })
  }, [])

  // Stop rendering frames once the hero has scrolled away.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={section} className="relative flex min-h-[100svh] flex-col overflow-hidden pt-24">
      <div aria-hidden className="cr-hero-glow pointer-events-none absolute inset-0" />
      <div aria-hidden className="cr-grid pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="cr-chip"
        >
          <span className="size-2 rounded-full bg-[var(--cr-green)] shadow-[0_0_12px_var(--cr-green)]" />
          Free · offline · no ads · no accounts
        </motion.p>

        <h1 className="cr-display mt-6 text-[clamp(2.9rem,9vw,7.5rem)] leading-[0.9] tracking-[-0.04em]">
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
          >
            Phone on your
          </motion.span>
          <motion.span
            className="relative mt-3 inline-block sm:mt-4"
            initial={{ opacity: 0, y: 40, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.22 }}
          >
            <span className="cr-sticker-text">forehead.</span>
          </motion.span>
        </h1>

        <div className="relative -my-4 h-[min(60vh,560px)] w-screen sm:-my-8">
          {mode === '3d' && fonts ? (
            <SceneBoundary>
              <DexScene
                eventSource={section}
                family={fonts.display}
                bodyFamily={fonts.body}
                active={visible}
                onPoke={() => setPokes((p) => p + 1)}
              />
            </SceneBoundary>
          ) : (
            <StickerFallback />
          )}

          {/* Shouts from the room, popping in around Dex. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-4xl -translate-x-1/2">
            {SHOUTS.map((shout, i) => (
              <span key={shout} className="cr-shout" style={{ ['--i' as string]: i }}>
                {shout}
              </span>
            ))}
          </div>
          {pokes > 0 ? (
            <motion.p
              key={pokes}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: -30, scale: 1 }}
              transition={{ duration: 1.2 }}
              className="cr-display pointer-events-none absolute left-1/2 top-[18%] -translate-x-1/2 text-2xl text-[var(--cr-yellow)]"
            >
              {['Boing!', 'Hey!', 'Again!', 'Hehe', 'Wheee'][pokes % 5]}
            </motion.p>
          ) : null}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="relative z-10 max-w-xl text-balance text-base text-white/70 sm:text-lg"
        >
          Your friends yell clues. You guess. Make decks about your own people, inside jokes and all, and
          share them with a QR code. Seventeen decks free from the start.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <AppStoreButton />
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="cr-btn cr-btn-glass">
            <GithubMark />
            Open source on GitHub
          </a>
        </motion.div>

        <p className="relative z-10 mt-4 text-xs text-white/40">Tip: poke Dex.</p>

        <a href="#how" className="relative z-10 mb-8 mt-auto pt-10 text-white/40 transition hover:text-white" aria-label="How it works">
          <ArrowDown className="animate-bounce" size={22} />
        </a>
      </div>
    </section>
  )
}
