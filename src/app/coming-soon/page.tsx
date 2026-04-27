'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins } from 'lucide-react'
import Link from 'next/link'

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface Card {
  suit: Suit
  rank: Rank
  hidden?: boolean
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function cardValue(card: Card): number {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10
  if (card.rank === 'A') return 11
  return parseInt(card.rank)
}

function handTotal(hand: Card[]): number {
  let total = 0
  let aces = 0
  for (const card of hand) {
    if (card.hidden) continue
    total += cardValue(card)
    if (card.rank === 'A') aces++
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

function isRed(suit: Suit) {
  return suit === '♥' || suit === '♦'
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

function Confetti({ burstKey, big }: { burstKey: number; big: boolean }) {
  if (burstKey === 0) return null
  const count = big ? 40 : 14
  const emojis = big ? ['🃏', '🎉', '✨', '💰', '🎊'] : ['✨', '🪙', '⭐']

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
        const distance = 100 + Math.random() * 160
        return (
          <motion.div
            key={`${burstKey}-${i}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + 60,
              opacity: 0,
              scale: 1,
              rotate: Math.random() * 720 - 360,
            }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute text-xl"
          >
            {emojis[Math.floor(Math.random() * emojis.length)]}
          </motion.div>
        )
      })}
    </div>
  )
}

function PlayingCard({ card, index, total }: { card: Card; index: number; total: number }) {
  const red = isRed(card.suit)

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, rotate: Math.random() * 10 - 5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative flex-shrink-0"
      style={{
        width: 64,
        height: 92,
        marginLeft: index > 0 ? -20 : 0,
        zIndex: index,
      }}
    >
      {card.hidden ? (
        <div
          className="w-full h-full rounded-lg border border-white/20"
          style={{
            background:
              'repeating-linear-gradient(45deg, #1a1a2e 0px, #1a1a2e 4px, #16213e 4px, #16213e 8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        />
      ) : (
        <div
          className="w-full h-full rounded-lg border border-white/15 flex flex-col items-center justify-between p-1.5"
          style={{
            background: 'linear-gradient(145deg, #1e1e2e 0%, #12121e 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <div className={`text-xs font-bold self-start leading-none ${red ? 'text-red-400' : 'text-white'}`}>
            {card.rank}
            <br />
            <span className="text-[10px]">{card.suit}</span>
          </div>
          <span className={`text-2xl ${red ? 'text-red-400' : 'text-white'}`}>
            {card.suit}
          </span>
          <div className={`text-xs font-bold self-end leading-none rotate-180 ${red ? 'text-red-400' : 'text-white'}`}>
            {card.rank}
            <br />
            <span className="text-[10px]">{card.suit}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

type GameState = 'betting' | 'playing' | 'dealerTurn' | 'result'

export default function ComingSoonPage() {
  const [coins, setCoins] = useState(50)
  const [bet, setBet] = useState(5)
  const [deck, setDeck] = useState<Card[]>(() => buildDeck())
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [gameState, setGameState] = useState<GameState>('betting')
  const [message, setMessage] = useState('coming soon — play some blackjack')
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [bigWin, setBigWin] = useState(false)
  const [justWon, setJustWon] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [firstDeal, setFirstDeal] = useState(true)

  const maxBet = Math.max(1, Math.min(25, coins || 1))

  // Auto-deal a free hand on first load
  useEffect(() => {
    if (firstDeal) {
      const timer = setTimeout(() => {
        setFirstDeal(false)
        dealFree()
      }, 600)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (coins > 0 && bet > coins) setBet(Math.min(coins, maxBet))
  }, [coins, bet, maxBet])

  const drawCard = useCallback(
    (hidden = false): Card => {
      const card = deck[0]
      setDeck((d) => d.slice(1))
      return { ...card, hidden }
    },
    [deck],
  )

  const deal = () => {
    if (coins < bet) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }

    const newDeck = buildDeck()
    setDeck(newDeck)
    setJustWon(false)
    setBigWin(false)

    const p1 = newDeck[0]
    const d1 = newDeck[1]
    const p2 = newDeck[2]
    const d2 = { ...newDeck[3], hidden: true }

    setPlayerHand([p1, p2])
    setDealerHand([d1, d2])
    setDeck(newDeck.slice(4))
    setCoins((c) => c - bet)
    setGameState('playing')
    setMessage('hit or stand?')

    const playerTotal = cardValue(p1) + cardValue(p2)
    let adjustedTotal = playerTotal
    if (p1.rank === 'A' && p2.rank === 'A') adjustedTotal = 12
    if (adjustedTotal === 21) {
      setTimeout(() => {
        setDealerHand([d1, newDeck[3]])
        resolveGame([p1, p2], [d1, newDeck[3]], newDeck.slice(4))
      }, 600)
    }
  }

  const dealFree = () => {
    const newDeck = buildDeck()
    setDeck(newDeck)
    setJustWon(false)
    setBigWin(false)

    const p1 = newDeck[0]
    const d1 = newDeck[1]
    const p2 = newDeck[2]
    const d2 = { ...newDeck[3], hidden: true }

    setPlayerHand([p1, p2])
    setDealerHand([d1, d2])
    setDeck(newDeck.slice(4))
    setGameState('playing')
    setMessage('first hand is free — hit or stand?')
  }

  const hit = () => {
    if (gameState !== 'playing') return
    const card = deck[0]
    const newDeck = deck.slice(1)
    const newHand = [...playerHand, card]
    setPlayerHand(newHand)
    setDeck(newDeck)

    const total = handTotal(newHand)
    if (total > 21) {
      setGameState('result')
      setMessage('bust! you lose')
    } else if (total === 21) {
      stand(newHand, newDeck)
    }
  }

  const stand = (pHand?: Card[], currentDeck?: Card[]) => {
    const pH = pHand || playerHand
    const dk = currentDeck || deck

    setGameState('dealerTurn')
    const revealedDealer = dealerHand.map((c) => ({ ...c, hidden: false }))
    setDealerHand(revealedDealer)

    let dHand = [...revealedDealer]
    let d = [...dk]

    const dealerPlay = () => {
      const dTotal = handTotal(dHand)
      if (dTotal < 17) {
        const card = d[0]
        d = d.slice(1)
        dHand = [...dHand, { ...card, hidden: false }]
        setDealerHand([...dHand])
        setDeck([...d])
        setTimeout(dealerPlay, 500)
      } else {
        resolveGame(pH, dHand, d)
      }
    }

    setTimeout(dealerPlay, 500)
  }

  const resolveGame = (pH: Card[], dH: Card[], remainingDeck: Card[]) => {
    const pTotal = handTotal(pH)
    const dTotal = handTotal(dH)
    setGameState('result')
    setDeck(remainingDeck)

    const isBlackjack = pH.length === 2 && pTotal === 21

    if (pTotal > 21) {
      setMessage('bust! you lose')
    } else if (dTotal > 21) {
      const winnings = bet * 2
      setCoins((c) => c + winnings)
      setMessage(`dealer busts! +${winnings}`)
      triggerWin(false)
    } else if (isBlackjack && !(dH.length === 2 && dTotal === 21)) {
      const winnings = Math.floor(bet * 2.5)
      setCoins((c) => c + winnings)
      setMessage(`BLACKJACK! +${winnings}`)
      triggerWin(true)
    } else if (pTotal > dTotal) {
      const winnings = bet * 2
      setCoins((c) => c + winnings)
      setMessage(`you win! +${winnings}`)
      triggerWin(false)
    } else if (pTotal === dTotal) {
      setCoins((c) => c + bet)
      setMessage('push — bet returned')
    } else {
      setMessage('dealer wins')
    }
  }

  const triggerWin = (big: boolean) => {
    setJustWon(true)
    setBigWin(big)
    setConfettiBurst((k) => k + 1)
    setTimeout(() => setJustWon(false), 1400)
    setTimeout(() => setBigWin(false), 900)
  }

  const playerTotal = handTotal(playerHand)
  const dealerTotal = handTotal(dealerHand)

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-6 px-4 relative overflow-hidden">
      <AnimatePresence>
        {bigWin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 bg-yellow-400 pointer-events-none z-40"
          />
        )}
      </AnimatePresence>

      <div className="text-center">
        <motion.h1
          className="text-5xl sm:text-6xl font-bold tracking-tight mb-2"
          style={{
            background: 'linear-gradient(90deg, #ffffff 0%, #facc15 50%, #ffffff 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          animate={{ backgroundPosition: ['200% center', '-200% center'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          BLACKJACK
        </motion.h1>
        <p className="text-white/40 text-xs tracking-widest uppercase mb-1">coming soon</p>
        <p className="text-white/50 text-sm tracking-wide min-h-[20px]">{message}</p>
      </div>

      <motion.div
        animate={{ x: shaking ? [-4, 4, -4, 4, 0] : 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-3xl p-5 pt-4 border border-white/10 w-[340px]"
        style={{
          boxShadow: justWon
            ? '0 0 60px rgba(250, 204, 21, 0.5), 0 0 0 1px rgba(250, 204, 21, 0.3)'
            : '0 25px 50px -12px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        <Confetti burstKey={confettiBurst} big={bigWin} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <motion.span
            animate={{ scale: justWon ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.5 }}
            className="text-yellow-400 text-sm font-medium flex items-center gap-1.5"
          >
            <Coins className="h-4 w-4" />
            <CoinCounter value={coins} />
          </motion.span>
          <span className="text-white/30 text-xs uppercase tracking-widest">blackjack</span>
        </div>

        {/* Dealer hand */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-widest">dealer</span>
            {dealerHand.length > 0 && (
              <span className="text-white/50 text-xs tabular-nums">{dealerTotal}</span>
            )}
          </div>
          <div className="flex items-center justify-center min-h-[96px] bg-black/30 rounded-xl p-2">
            {dealerHand.length > 0 ? (
              <div className="flex">
                {dealerHand.map((card, i) => (
                  <PlayingCard key={`d-${i}`} card={card} index={i} total={dealerHand.length} />
                ))}
              </div>
            ) : (
              <span className="text-white/15 text-xs">—</span>
            )}
          </div>
        </div>

        {/* Player hand */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-widest">you</span>
            {playerHand.length > 0 && (
              <span
                className={`text-xs tabular-nums ${
                  playerTotal > 21
                    ? 'text-red-400'
                    : playerTotal === 21
                      ? 'text-green-400'
                      : 'text-white/50'
                }`}
              >
                {playerTotal}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center min-h-[96px] bg-black/30 rounded-xl p-2">
            {playerHand.length > 0 ? (
              <div className="flex">
                {playerHand.map((card, i) => (
                  <PlayingCard key={`p-${i}`} card={card} index={i} total={playerHand.length} />
                ))}
              </div>
            ) : (
              <span className="text-white/15 text-xs">—</span>
            )}
          </div>
        </div>

        {/* Bet slider — only during betting */}
        {gameState === 'betting' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-xs uppercase tracking-widest">bet</span>
              <span className="text-yellow-400 text-xs font-medium tabular-nums flex items-center gap-1">
                <Coins className="h-3 w-3" />
                {bet}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={maxBet}
              step={1}
              value={Math.min(bet, maxBet)}
              onChange={(e) => setBet(Number(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>1</span>
              <span>{maxBet}</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {gameState === 'betting' && (
            <motion.button
              onClick={deal}
              disabled={coins < bet}
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-3 rounded-xl font-medium text-sm tracking-wide bg-green-600 text-white hover:bg-green-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {coins >= bet ? `deal (${bet})` : 'out of coins'}
            </motion.button>
          )}

          {gameState === 'playing' && (
            <>
              <motion.button
                onClick={hit}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl font-medium text-sm tracking-wide bg-white/10 text-white hover:bg-white/15 transition-colors"
              >
                hit
              </motion.button>
              <motion.button
                onClick={() => stand()}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 rounded-xl font-medium text-sm tracking-wide bg-white/10 text-white hover:bg-white/15 transition-colors"
              >
                stand
              </motion.button>
            </>
          )}

          {gameState === 'dealerTurn' && (
            <div className="flex-1 py-3 rounded-xl text-center text-sm tracking-wide text-white/40">
              dealer playing...
            </div>
          )}

          {gameState === 'result' && (
            <motion.button
              onClick={() => {
                setPlayerHand([])
                setDealerHand([])
                setGameState('betting')
                setMessage('place your bet')
              }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 py-3 rounded-xl font-medium text-sm tracking-wide bg-white/10 text-white hover:bg-white/15 transition-colors"
            >
              play again
            </motion.button>
          )}
        </div>
      </motion.div>

      <Link
        href="/"
        className="text-white/40 text-xs hover:text-white/70 transition-colors tracking-wide"
      >
        ← back home
      </Link>
    </div>
  )
}
