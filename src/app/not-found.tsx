'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { Coins } from 'lucide-react'
import Link from 'next/link'

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🍀', '⭐']
const REEL_SIZE = 20

function buildReel() {
  return Array.from({ length: REEL_SIZE }, () =>
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
  )
}

interface Payout {
  match: number
  label: string
  jackpot?: boolean
}

const PAYOUTS: Record<string, Payout> = {
  '💎💎💎': { match: 100, label: 'JACKPOT!', jackpot: true },
  '7️⃣7️⃣7️⃣': { match: 77, label: 'LUCKY 7s!' },
  '🍀🍀🍀': { match: 50, label: 'LUCKY!' },
  '⭐⭐⭐': { match: 30, label: 'STARS!' },
  '🍒🍒🍒': { match: 20, label: 'CHERRIES!' },
  '🍇🍇🍇': { match: 15, label: 'GRAPES!' },
  '🍊🍊🍊': { match: 10, label: 'ORANGES!' },
  '🍋🍋🍋': { match: 10, label: 'LEMONS!' },
}

function checkWin(a: string, b: string, c: string): Payout | null {
  const key = `${a}${b}${c}`
  if (PAYOUTS[key]) return PAYOUTS[key]
  if (a === b || b === c || a === c) return { match: 3, label: 'small win' }
  return null
}

function CoinCounter({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value)

  useEffect(() => {
    if (displayed === value) return
    const diff = value - displayed
    const step = Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) / 15))
    const timer = setTimeout(() => {
      setDisplayed((d) => {
        const next = d + step
        if ((step > 0 && next > value) || (step < 0 && next < value)) return value
        return next
      })
    }, 25)
    return () => clearTimeout(timer)
  }, [value, displayed])

  return <span className="tabular-nums">{displayed}</span>
}

function Confetti({ burstKey, jackpot }: { burstKey: number; jackpot: boolean }) {
  if (burstKey === 0) return null
  const count = jackpot ? 50 : 18
  const emojis = jackpot ? ['💎', '🎉', '✨', '🎊', '💫', '🪙'] : ['✨', '🪙', '⭐']

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
        const distance = 120 + Math.random() * 180
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance
        const emoji = emojis[Math.floor(Math.random() * emojis.length)]
        return (
          <motion.div
            key={`${burstKey}-${i}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
            animate={{
              x: dx,
              y: dy + 80,
              opacity: 0,
              scale: 1,
              rotate: Math.random() * 720 - 360,
            }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            className="absolute text-2xl"
          >
            {emoji}
          </motion.div>
        )
      })}
    </div>
  )
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
      className="relative overflow-hidden w-20 rounded-lg bg-black/40 border border-white/10"
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

function SpinButton({
  onPress,
  disabled,
  spinning,
}: {
  onPress: () => void
  disabled: boolean
  spinning: boolean
}) {
  const isActive = !disabled && !spinning

  return (
    <motion.button
      onClick={onPress}
      disabled={!isActive}
      whileHover={isActive ? { scale: 1.03 } : {}}
      whileTap={isActive ? { scale: 0.92, y: 3 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className="relative mx-auto rounded-full font-bold text-white tracking-widest text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed"
      style={{
        width: 96,
        height: 96,
        background: isActive
          ? 'radial-gradient(circle at 35% 30%, #ff7070 0%, #e03030 45%, #a00f0f 100%)'
          : 'radial-gradient(circle at 35% 30%, #555 0%, #333 50%, #222 100%)',
        boxShadow: isActive
          ? '0 8px 20px rgba(224,48,48,0.5), 0 2px 4px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.35), inset 0 3px 6px rgba(255,255,255,0.35)'
          : '0 2px 6px rgba(0,0,0,0.4), inset 0 -2px 4px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.08)',
        opacity: disabled && !spinning ? 0.5 : 1,
      }}
    >
      <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {spinning ? '...' : 'SPIN'}
      </span>
    </motion.button>
  )
}

export default function NotFound() {
  const [coins, setCoins] = useState(20)
  const [bet, setBet] = useState(1)
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState('page not found — try your luck')
  const [reels, setReels] = useState(() => [buildReel(), buildReel(), buildReel()])
  const [finals, setFinals] = useState([0, 0, 0])
  const [spinKey, setSpinKey] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [isJackpot, setIsJackpot] = useState(false)
  const [justWon, setJustWon] = useState(false)

  const maxBet = Math.max(1, Math.min(5, coins || 1))

  useEffect(() => {
    if (coins > 0 && bet > coins) setBet(coins)
  }, [coins, bet])

  const spin = () => {
    if (spinning) return
    if (coins < bet) {
      setMessage('not enough coins')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }

    setCoins((c) => c - bet)
    setMessage('spinning...')
    setSpinning(true)
    setJustWon(false)

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
        const winnings = result.match * bet
        setCoins((prev) => prev + winnings)
        setMessage(`${result.label} +${winnings} coins!`)
        setJustWon(true)
        setIsJackpot(!!result.jackpot)
        setConfettiBurst((k) => k + 1)
        setTimeout(() => setJustWon(false), 1400)
        setTimeout(() => setIsJackpot(false), 900)
      } else {
        setMessage('no match — spin again')
      }
      setSpinning(false)
    }, totalDuration)
  }

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-8 px-4 relative overflow-hidden">
      <AnimatePresence>
        {isJackpot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 bg-yellow-400 pointer-events-none z-40"
          />
        )}
      </AnimatePresence>

      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-white/50 text-sm tracking-wide min-h-[20px]">{message}</p>
      </div>

      <motion.div
        animate={{
          x: shaking ? [-4, 4, -4, 4, 0] : 0,
        }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-3xl p-6 pt-4 border border-white/10 shadow-2xl w-[320px]"
        style={{
          boxShadow: justWon
            ? '0 0 60px rgba(250, 204, 21, 0.5), 0 0 0 1px rgba(250, 204, 21, 0.3)'
            : '0 25px 50px -12px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        <Confetti burstKey={confettiBurst} jackpot={isJackpot} />

        <div className="flex items-center justify-between mb-4 px-1">
          <motion.span
            animate={{ scale: justWon ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.5 }}
            className="text-yellow-400 text-sm font-medium flex items-center gap-1.5"
          >
            <Coins className="h-4 w-4" />
            <CoinCounter value={coins} />
          </motion.span>
          <span className="text-white/30 text-xs uppercase tracking-widest">slots</span>
        </div>

        <div className="flex gap-2 mb-5 justify-center">
          {reels.map((symbols, i) => (
            <div key={`${i}-${spinKey}`} className="relative">
              {justWon && (
                <motion.div
                  className="absolute inset-0 rounded-lg ring-2 ring-yellow-400 pointer-events-none z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1, 0] }}
                  transition={{ duration: 1.2 }}
                />
              )}
              <Reel
                symbols={symbols}
                finalIndex={finals[i]}
                spinning={spinning}
                delay={i}
              />
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-xs uppercase tracking-widest">bet</span>
            <span className="text-yellow-400 text-xs font-medium tabular-nums flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {bet} · {bet}x payout
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxBet}
            step={1}
            value={Math.min(bet, maxBet)}
            onChange={(e) => setBet(Number(e.target.value))}
            disabled={spinning}
            className="w-full accent-yellow-400 cursor-pointer disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] text-white/30 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n === bet ? 'text-yellow-400' : ''}>
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 mt-1">
          <SpinButton
            onPress={spin}
            disabled={coins < bet}
            spinning={spinning}
          />
          <span className="text-white/30 text-[10px] uppercase tracking-widest min-h-[14px]">
            {spinning ? 'spinning...' : coins >= bet ? `tap to spin · ${bet} coin${bet > 1 ? 's' : ''}` : 'out of coins'}
          </span>
        </div>
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
