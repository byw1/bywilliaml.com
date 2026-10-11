'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { ShadeSticker } from './shade-sticker'
import { INK, palette, textOn, TOPICS } from './data'

/**
 * A round of Imposter, small enough to play on a web page. Four friends and
 * you. Hold to peek your card (a third of the time you're the imposter), hear
 * the clues, then vote, or, if you were the imposter and got caught, try to
 * steal the win by guessing the word. The clues are written for the demo;
 * the words and topics are the app's own.
 */

type DemoRound = {
  topic: string
  word: string
  /** Clues from players who are in. */
  clues: string[]
  /** What a bot imposter says, not knowing the word. */
  bluff: string
  /** The steal: the word and its neighbours in the same topic. */
  options: string[]
}

const ROUNDS: DemoRound[] = [
  { topic: 'Food', word: 'Pizza', clues: ['Slice', 'Cheese', 'Delivery', 'Crust'], bluff: 'Dinner', options: ['Pizza', 'Spaghetti', 'Lasagna', 'Burger', 'Tacos', 'Pancakes'] },
  { topic: 'Animals', word: 'Penguin', clues: ['Tuxedo', 'Ice', 'Waddle', 'Antarctica'], bluff: 'Cute', options: ['Penguin', 'Polar bear', 'Seal', 'Owl', 'Dolphin', 'Panda'] },
  { topic: 'Places', word: 'Airport', clues: ['Gate', 'Delay', 'Security', 'Runway'], bluff: 'Busy', options: ['Airport', 'Train station', 'Hotel', 'Mall', 'Cruise ship', 'Stadium'] },
  { topic: 'Movies & TV', word: 'Titanic', clues: ['Iceberg', 'Door', 'Ship', 'Heart'], bluff: 'Classic', options: ['Titanic', 'Jaws', 'Frozen', 'Finding Nemo', 'Star Wars', 'Shrek'] },
  { topic: 'Jobs', word: 'Firefighter', clues: ['Ladder', 'Hose', 'Rescue', 'Siren'], bluff: 'Uniform', options: ['Firefighter', 'Pilot', 'Doctor', 'Chef', 'Astronaut', 'Plumber'] },
  { topic: 'Around the house', word: 'Toaster', clues: ['Bread', 'Pop', 'Crumbs', 'Breakfast'], bluff: 'Kitchen', options: ['Toaster', 'Fridge', 'Microwave', 'Couch', 'Lamp', 'Vacuum'] },
]

const FRIENDS = [
  { name: 'Maya', color: palette.purple },
  { name: 'Sam', color: palette.teal },
  { name: 'Jordan', color: palette.yellow },
  { name: 'Ari', color: palette.orange },
]
const YOU = { name: 'You', color: palette.lime }
const HOLD_MS = 600

type Seat = { name: string; color: string; you: boolean }
type Phase = 'peek' | 'clues' | 'vote' | 'steal' | 'verdict'
type Outcome = 'caught' | 'escaped' | 'stolen'

/** You sit in the middle of the table. */
const SEATS: Seat[] = [
  ...FRIENDS.slice(0, 2).map((f) => ({ ...f, you: false })),
  { ...YOU, you: true },
  ...FRIENDS.slice(2).map((f) => ({ ...f, you: false })),
]

type Game = {
  round: DemoRound
  topic: (typeof TOPICS)[number]
  seats: Seat[]
  /** Clue order, as seat indexes, from a random start seat. */
  order: number[]
  imposter: number
  options: string[]
}

/** True with probability p. Only ever called from event handlers. */
function chance(p: number): boolean {
  return Math.random() < p
}

/** One of the items, at random. */
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function deal(previous?: DemoRound): Game {
  const pool = ROUNDS.filter((r) => r !== previous)
  const round = pool[Math.floor(Math.random() * pool.length)]
  const topic = TOPICS.find((t) => t.name === round.topic) ?? TOPICS[0]
  const seats = SEATS
  const youAt = seats.findIndex((s) => s.you)
  const others = seats.map((_, i) => i).filter((i) => i !== youAt)
  const imposter = Math.random() < 1 / 3 ? youAt : others[Math.floor(Math.random() * others.length)]
  const start = Math.floor(Math.random() * seats.length)
  const order = seats.map((_, i) => (start + i) % seats.length)
  return { round, topic, seats, order, imposter, options: shuffled(round.options) }
}

/** The same table every time, for the server render. The browser deals for real. */
function firstDeal(): Game {
  const round = ROUNDS[0]
  const seats = SEATS
  return { round, topic: TOPICS.find((t) => t.name === round.topic) ?? TOPICS[0], seats, order: seats.map((_, i) => i), imposter: 0, options: round.options }
}

function Dot({ seat, size = 'md' }: { seat: Seat; size?: 'md' | 'lg' }) {
  return (
    <span
      className="im-seat-dot"
      style={{ background: seat.color, width: size === 'lg' ? '2.4rem' : undefined, height: size === 'lg' ? '2.4rem' : undefined }}
    >
      {seat.you ? '★' : seat.name[0]}
    </span>
  )
}

/** The secret card, exactly as the app draws it: same colour for everyone, in or imposter. */
function RoleCard({ game, revealed }: { game: Game; revealed: boolean }) {
  const youAt = game.seats.findIndex((s) => s.you)
  const imposter = game.imposter === youAt
  if (!revealed) {
    return (
      <div className="im-role flex h-full flex-col items-center justify-between bg-[var(--im-raised)] p-4">
        <span className="flex items-center gap-1.5 text-[0.7rem] font-extrabold tracking-[0.1em] text-[var(--im-muted)]">
          <Lock size={14} aria-hidden /> SECRET
        </span>
        <div className="flex flex-col items-center gap-3">
          <span className="im-redact h-10 w-40" />
          <span className="im-redact h-5 w-28 opacity-60" />
        </div>
        <div className="w-full rounded-2xl bg-white/[0.12] px-3 py-2.5 text-left">
          <p className="text-[0.65rem] font-extrabold tracking-[0.1em] text-[var(--im-muted)]">HOLD TO PEEK</p>
          <p className="text-xs text-[var(--im-muted)]">Only you look.</p>
        </div>
      </div>
    )
  }
  const fill = game.topic.color
  const ink = textOn(fill)
  return (
    <motion.div
      initial={{ rotateY: 80, scale: 0.94 }}
      animate={{ rotateY: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="im-role flex h-full flex-col items-center justify-between p-4"
      style={{ background: fill, color: ink }}
    >
      <span className="im-role-blob -left-24 -top-28 size-60" />
      <span className="im-role-blob -bottom-24 -right-16 size-48" />
      <span className="relative text-[0.7rem] font-extrabold tracking-[0.1em]">
        {game.topic.emoji} {game.topic.name.toUpperCase()}
      </span>
      <motion.span
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="im-display relative text-center text-[2.4rem] leading-[0.95] tracking-[-0.03em]"
      >
        {imposter ? 'Imposter' : game.round.word}
      </motion.span>
      <div className="im-strip relative w-full px-3 py-2.5 text-left">
        <p className="text-[0.65rem] font-extrabold tracking-[0.1em] text-[var(--im-lime)]">{imposter ? "YOU'RE THE IMPOSTER" : "YOU'RE IN"}</p>
        <p className="text-xs text-white">{imposter ? "You don't know the word. Blend in." : 'One word about it. Not too obvious.'}</p>
      </div>
    </motion.div>
  )
}

export function TableDemo() {
  const [game, setGame] = useState<Game>(firstDeal)
  const [phase, setPhase] = useState<Phase>('peek')
  const [held, setHeld] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [peeked, setPeeked] = useState(false)
  const [spoken, setSpoken] = useState(0)
  const [accused, setAccused] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [guess, setGuess] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const youAt = game.seats.findIndex((s) => s.you)
  const youAreImposter = game.imposter === youAt

  // Shuffling on the server would mismatch hydration, so the real deal waits
  // for the first touch. The card is face down until then, so nothing shows.
  const [dealt, setDealt] = useState(false)

  const press = () => {
    if (!dealt) {
      setGame(deal())
      setDealt(true)
    }
    setHeld(true)
    timer.current = window.setTimeout(() => {
      setRevealed(true)
      setPeeked(true)
    }, HOLD_MS)
  }
  const release = () => {
    setHeld(false)
    setRevealed(false)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  // Clues come round the table one at a time. Your turn waits for you.
  useEffect(() => {
    if (phase !== 'clues' || spoken >= game.order.length) return
    if (game.order[spoken] === youAt) return
    const t = window.setTimeout(() => setSpoken((n) => n + 1), 950)
    return () => window.clearTimeout(t)
  }, [game.order, phase, spoken, youAt])

  const clueFor = useCallback(
    (seat: number) => {
      if (seat === game.imposter) return game.round.bluff
      const inSeats = game.order.filter((s) => s !== game.imposter && s !== youAt)
      return game.round.clues[inSeats.indexOf(seat) % game.round.clues.length]
    },
    [game, youAt],
  )

  const vote = (seat: number) => {
    setAccused(seat)
    if (seat !== game.imposter) {
      setOutcome('escaped')
      setPhase('verdict')
      return
    }
    // Caught. The imposter gets one guess at the word.
    if (chance(0.35)) {
      setGuess(game.round.word)
      setOutcome('stolen')
    } else {
      setGuess(game.options.find((o) => o !== game.round.word) ?? null)
      setOutcome('caught')
    }
    setPhase('verdict')
  }

  // When you're the imposter, the table votes without you.
  const tableVotes = () => {
    if (chance(0.55)) {
      setAccused(youAt)
      setPhase('steal')
    } else {
      const others = game.seats.map((_, i) => i).filter((i) => i !== youAt)
      setAccused(pick(others))
      setOutcome('escaped')
      setPhase('verdict')
    }
  }

  const steal = (word: string) => {
    setGuess(word)
    setOutcome(word === game.round.word ? 'stolen' : 'caught')
    setPhase('verdict')
  }

  const again = () => {
    setGame((g) => deal(g.round))
    setPhase('peek')
    setPeeked(false)
    setRevealed(false)
    setSpoken(0)
    setAccused(null)
    setOutcome(null)
    setGuess(null)
  }

  const imposterName = game.seats[game.imposter].name
  const accusedName = accused !== null ? game.seats[accused].name : ''
  const verdictFill = outcome === 'caught' ? palette.blue : palette.red
  const youWon = outcome ? (youAreImposter ? outcome !== 'caught' : outcome === 'caught') : false

  let verdictLine = ''
  if (outcome === 'caught') verdictLine = youAreImposter ? `You guessed “${guess}”. It was “${game.round.word}”.` : `It was ${imposterName}. They guessed “${guess}”.`
  if (outcome === 'stolen') verdictLine = youAreImposter ? `You guessed “${game.round.word}”. Steal!` : `${imposterName} guessed “${game.round.word}”.`
  if (outcome === 'escaped') verdictLine = youAreImposter ? `They voted ${accusedName}. You got away with it.` : `${accusedName} was in. It was ${imposterName}.`

  return (
    <div className="grid items-center gap-10 md:grid-cols-[minmax(0,330px)_1fr] md:gap-14">
      <div className="im-phone relative mx-auto aspect-[9/19.5] w-full max-w-[330px] p-[3.5%]">
        <div className="im-screen relative flex h-full flex-col overflow-hidden px-4 pb-5 pt-10">
          <div aria-hidden className="absolute left-1/2 top-3 h-[22px] w-[34%] -translate-x-1/2 rounded-full bg-black" />

          <AnimatePresence mode="wait">
            {phase === 'peek' ? (
              <motion.div key="peek" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
                <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-white/45">Pass the phone to</p>
                <p className="im-display mt-1 text-center text-4xl tracking-[-0.03em]">You</p>
                <div className="mt-4 min-h-0 flex-1 [perspective:900px]">
                  <RoleCard game={game} revealed={revealed} />
                </div>
                <button
                  type="button"
                  className="im-hold im-btn im-btn-primary relative mt-4 w-full select-none"
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                    press()
                  }}
                  onPointerUp={release}
                  onPointerCancel={release}
                  onContextMenu={(e) => e.preventDefault()}
                  onKeyDown={(e) => {
                    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                      e.preventDefault()
                      press()
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') release()
                  }}
                  onBlur={release}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 rounded-full bg-black/15"
                    style={{ width: held ? '100%' : '0%', transition: held ? `width ${HOLD_MS}ms linear` : 'none' }}
                  />
                  <span className="relative">{revealed ? 'Let go to hide' : 'Hold to peek'}</span>
                </button>
                <button
                  type="button"
                  disabled={!peeked}
                  onClick={() => setPhase('clues')}
                  className="mt-3 text-sm font-bold text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-white disabled:pointer-events-none disabled:opacity-30"
                >
                  Got it. Everyone&apos;s peeked →
                </button>
              </motion.div>
            ) : null}

            {phase === 'clues' ? (
              <motion.div key="clues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
                <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-white/45">Clues · one word each</p>
                <p className="mt-1 text-center text-sm text-white/60">
                  {game.topic.emoji} {youAreImposter ? `Topic: ${game.topic.name}` : `Your word: ${game.round.word}`}
                </p>
                <ul className="mt-4 flex flex-1 flex-col justify-center gap-2.5">
                  {game.order.map((seat, i) => {
                    const s = game.seats[seat]
                    const said = i < spoken
                    const now = i === spoken
                    return (
                      <li key={seat} className="flex items-center gap-2.5" style={{ opacity: said || now ? 1 : 0.35 }}>
                        <Dot seat={s} />
                        <span className="w-14 text-sm font-bold">{s.name}</span>
                        {said ? (
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                            className="im-display rounded-2xl rounded-bl-md bg-white px-3 py-1 text-base text-[#0C0A10]"
                          >
                            {s.you ? 'Said it out loud' : clueFor(seat)}
                          </motion.span>
                        ) : now ? (
                          <span className="text-sm text-white/50">{s.you ? 'your turn…' : 'thinking…'}</span>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                {game.order[spoken] === youAt ? (
                  <div className="mt-3">
                    <p className="text-center text-xs text-white/55">
                      {youAreImposter ? 'Bluff. Something that fits the topic.' : 'Say one word out loud. Not too obvious.'}
                    </p>
                    <button type="button" onClick={() => setSpoken((n) => n + 1)} className="im-btn im-btn-primary mt-2 w-full">
                      I said my word
                    </button>
                  </div>
                ) : spoken >= game.order.length ? (
                  <button type="button" onClick={() => (youAreImposter ? tableVotes() : setPhase('vote'))} className="im-btn im-btn-primary mt-3 w-full">
                    {youAreImposter ? 'The table votes…' : 'Time to vote'}
                  </button>
                ) : (
                  <div className="mt-3 h-12" />
                )}
              </motion.div>
            ) : null}

            {phase === 'vote' ? (
              <motion.div key="vote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
                <div className="flex justify-center">
                  <ShadeSticker size={84} mood="peek" bounce />
                </div>
                <p className="im-display mt-2 text-center text-3xl tracking-[-0.03em]">Who was it?</p>
                <p className="mt-1 text-center text-sm text-white/55">3, 2, 1… point. Tap who got the most fingers.</p>
                <div className="mt-5 flex flex-1 flex-col justify-center gap-2.5">
                  {game.order
                    .filter((seat) => seat !== youAt)
                    .map((seat) => {
                      const s = game.seats[seat]
                      return (
                        <button key={seat} type="button" onClick={() => vote(seat)} className="im-seat w-full justify-start py-2">
                          <Dot seat={s} size="lg" />
                          <span className="text-base">{s.name}</span>
                          <span className="ml-auto pr-1 text-sm text-white/50">“{clueFor(seat)}”</span>
                        </button>
                      )
                    })}
                </div>
              </motion.div>
            ) : null}

            {phase === 'steal' ? (
              <motion.div key="steal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full flex-col">
                <div className="flex justify-center">
                  <ShadeSticker size={84} mood="caught" />
                </div>
                <p className="im-display mt-2 text-center text-3xl tracking-[-0.03em]">They got you.</p>
                <p className="mt-1 text-center text-sm text-white/55">One guess at the word. Get it right and you steal the win.</p>
                <div className="mt-5 grid flex-1 grid-cols-2 content-center gap-2.5">
                  {game.options.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => steal(word)}
                      className="im-display rounded-2xl px-2 py-4 text-center text-lg leading-tight transition hover:-translate-y-0.5"
                      style={{ background: game.topic.color, color: textOn(game.topic.color) }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}

            {phase === 'verdict' && outcome ? (
              <motion.div
                key="verdict"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
                style={{ background: verdictFill, color: INK }}
              >
                <motion.div initial={{ scale: 1.8, rotate: -6 }} animate={{ scale: 1, rotate: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
                  <ShadeSticker size={110} mood={outcome === 'caught' ? 'caught' : outcome === 'stolen' ? 'excited' : 'wink'} />
                </motion.div>
                <p className="im-display mt-3 text-5xl leading-none tracking-[-0.03em]">
                  {outcome === 'caught' ? 'Caught!' : outcome === 'stolen' ? 'Stole it' : 'Got away'}
                </p>
                <p className="mt-3 text-sm font-semibold">{verdictLine}</p>
                <p className="mt-4 rounded-full bg-black/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em]">
                  {youWon ? 'You win this one' : 'Not your round'}
                </p>
                <button type="button" onClick={again} className="im-btn mt-6 bg-[#0C0A10] text-white">
                  Play again
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <ol className="space-y-5 text-left">
        {[
          ['Peek.', 'Hold the button and your card turns over. Let go and it’s face down again. A third of the time, you’re the imposter.'],
          ['Clue.', 'Everyone gives one word, starting from a random seat. Too obvious and the imposter has the answer; too vague and it looks like you.'],
          ['Vote.', 'Point on 3, 2, 1. Catch the imposter and they still get one guess at the word to steal the win.'],
        ].map(([title, body], i) => (
          <li key={title} className="flex gap-4">
            <span className="im-step-num shrink-0" style={{ background: [palette.lime, palette.blue, palette.red][i] }}>
              {i + 1}
            </span>
            <p className="text-white/65 sm:text-lg">
              <b className="im-display text-white">{title}</b> {body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
