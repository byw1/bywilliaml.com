'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useAnimation } from 'framer-motion'
import Link from 'next/link'

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🍀', '⭐']
const REEL_SIZE = 20

function buildReel() {
  return Array.from({ length: REEL_SIZE }, () =>
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
  )
}

const PAYOUTS: Record<string, { match: number; label: string }> = {
  '💎💎💎': { match: 100, label: 'JACKPOT!' },
  '7️⃣7️⃣7️⃣': { match: 77, label: 'LUCKY 7s!' },
  '🍀🍀🍀': { match: 50, label: 'LUCKY!' },
  '⭐⭐⭐': { match: 30, label: 'STARS!' },
  '🍒🍒🍒': { match: 20, label: 'CHERRIES!' },
  '🍇🍇🍇': { match: 15, label: 'GRAPES!' },
  '🍊🍊🍊': { match: 10, label: 'ORANGES!' },
  '🍋🍋🍋': { match: 10, label: 'LEMONS!' },
}

function checkWin(a: string, b: string, c: string) {
  const key = `${a}${b}${c}`
  if (PAYOUTS[key]) return PAYOUTS[key]
  if (a === b || b === c || a === c) return { match: 3, label: 'small win' }
  return null
}

function Reel({
  symbols,
  finalIndex,
  spinning,
  delay,
}: {
  symbols: string[]
  finalIndex: number
  spinning: boolean
  delay: number
}) {
  const controls = useAnimation()
  const symbolHeight = 72

  const startSpin = useCallback(async () => {
    await controls.start({
      y: [0, -symbolHeight * symbols.length * 2],
      transition: { duration: 0.3, ease: 'linear', repeat: 3 },
    })
    await controls.start({
      y: -symbolHeight * finalIndex,
      transition: {
        duration: 0.6 + delay * 0.3,
        ease: [0.2, 0.8, 0.3, 1],
      },
    })
  }, [controls, finalIndex, delay, symbols.length, symbolHeight])

  if (spinning) {
    startSpin()
  }

  return (
    <div
      className="relative overflow-hidden w-20 h-[72px] rounded-lg bg-black/40 border border-white/10"
      style={{ height: symbolHeight }}
    >
      <motion.div animate={controls} className="flex flex-col items-center">
        {[...symbols, ...symbols, ...symbols].map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-4xl shrink-0"
            style={{ height: symbolHeight, width: 80 }}
          >
            {s}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default function NotFound() {
  const [coins, setCoins] = useState(20)
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState('page not found — try your luck')
  const [reels, setReels] = useState(() => [buildReel(), buildReel(), buildReel()])
  const [finals, setFinals] = useState([0, 0, 0])
  const [spinKey, setSpinKey] = useState(0)
  const [shaking, setShaking] = useState(false)
  const leverRef = useRef<HTMLButtonElement>(null)

  const spin = () => {
    if (spinning) return
    if (coins <= 0) {
      setMessage('no coins left — refresh to restart')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }

    setCoins((c) => c - 1)
    setMessage('spinning...')
    setSpinning(true)

    const newReels = [buildReel(), buildReel(), buildReel()]
    const newFinals = [
      Math.floor(Math.random() * REEL_SIZE),
      Math.floor(Math.random() * REEL_SIZE),
      Math.floor(Math.random() * REEL_SIZE),
    ]

    setReels(newReels)
    setFinals(newFinals)
    setSpinKey((k) => k + 1)

    const totalDuration = 2200
    setTimeout(() => {
      const a = newReels[0][newFinals[0]]
      const b = newReels[1][newFinals[1]]
      const c = newReels[2][newFinals[2]]
      const result = checkWin(a, b, c)

      if (result) {
        setCoins((prev) => prev + result.match)
        setMessage(`${result.label} +${result.match} coins!`)
      } else {
        setMessage('no match — spin again')
      }
      setSpinning(false)
    }, totalDuration)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-white/50 text-sm tracking-wide">{message}</p>
      </div>

      <motion.div
        animate={shaking ? { x: [-4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-3xl p-6 pt-4 border border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-yellow-400 text-sm font-medium">🪙 {coins}</span>
          <span className="text-white/30 text-xs uppercase tracking-widest">slots</span>
        </div>

        <div className="flex gap-2 mb-5">
          {reels.map((symbols, i) => (
            <Reel
              key={`${i}-${spinKey}`}
              symbols={symbols}
              finalIndex={finals[i]}
              spinning={spinning}
              delay={i}
            />
          ))}
        </div>

        <button
          ref={leverRef}
          onClick={spin}
          disabled={spinning}
          className="w-full py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 bg-white/10 text-white hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {spinning ? 'spinning...' : coins > 0 ? 'pull lever (1 coin)' : 'out of coins'}
        </button>
      </motion.div>

      <Link
        href="/links"
        className="text-white/40 text-xs hover:text-white/70 transition-colors tracking-wide"
      >
        ← back home
      </Link>
    </div>
  )
}
