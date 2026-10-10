import Link from 'next/link'
import { ArrowUpRight, Camera, Moon, QrCode, Shuffle, Smartphone, Sparkles, Trophy, Users, WifiOff } from 'lucide-react'
import { DexSticker } from './dex-sticker'
import { GithubMark } from './github-mark'
import { Reveal } from './reveal'
import { DECKS, GITHUB_URL, INK, palette, textOn, type BundledDeck } from './data'

export function SectionHead({ kicker, title, children }: { kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="cr-kicker">{kicker}</p>
      <h2 className="cr-display mt-3 text-[clamp(2.2rem,6vw,4.2rem)] leading-[0.95] tracking-[-0.035em]">{title}</h2>
      {children ? <p className="mt-4 text-balance text-white/60 sm:text-lg">{children}</p> : null}
    </Reveal>
  )
}

/* ---------------------------------------------------------------- story -- */

export function Story() {
  return (
    <section className="relative px-4 py-28 sm:px-6">
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1fr_1.1fr]">
        <Reveal rotate={-4} className="relative mx-auto">
          <div className="cr-ticket">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.3em] text-[#0A0A0D]/60">Estimated wait</p>
            <p className="cr-display text-[4.5rem] leading-none text-[#0A0A0D]">95 min</p>
            <div className="my-3 border-t-2 border-dashed border-[#0A0A0D]/25" />
            <p className="text-sm font-bold text-[#0A0A0D]/75">Plenty of time for a few rounds.</p>
          </div>
          <DexSticker size={120} mood="excited" glyph="🎢" className="absolute -bottom-10 -right-10 rotate-12" bounce />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="cr-kicker">Why I made it</p>
          <h2 className="cr-display mt-3 text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.95] tracking-[-0.035em]">
            Started in a line at Disneyland.
          </h2>
          <div className="mt-5 space-y-4 text-white/65 sm:text-lg">
            <p>
              Long lines mean charades. Every app we tried was bad: ads between rounds, the good decks
              locked behind a paywall, and tilt controls that never worked.
            </p>
            <p>
              I wanted one where my friends and I could make our own decks, so I built it. No ads, no
              account, nothing to buy, and it works with zero signal. It&apos;s a side project and it&apos;s
              open source.
            </p>
            <p className="font-semibold text-white">— William</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ deck wall -- */

function DeckTile({ deck, tilt }: { deck: BundledDeck; tilt: number }) {
  const fg = textOn(deck.color)
  return (
    <div className="cr-deck" style={{ background: deck.color, color: fg, ['--tilt' as string]: `${tilt}deg` }}>
      <span className="cr-deck-emoji">{deck.emoji}</span>
      <span className="cr-display mt-auto text-[1.6rem] leading-[1] tracking-[-0.02em]">{deck.name}</span>
      <span className="mt-1 text-xs font-bold uppercase tracking-[0.16em] opacity-70">100 cards</span>
      <span className="cr-deck-peek" style={{ color: INK }}>
        {deck.cards[0]}
      </span>
    </div>
  )
}

export function DeckWall() {
  const half = Math.ceil(DECKS.length / 2)
  const rows = [DECKS.slice(0, half), DECKS.slice(half)]
  return (
    <section id="decks" className="relative overflow-hidden py-28">
      <div className="px-4 sm:px-6">
        <SectionHead kicker="17 decks · 1,700 cards" title={<>Every deck is free.</>}>
          Celebrities, Gen Z slang, 2010s throwbacks, emoji charades and more. Hide the cards you don&apos;t
          like and add your own to any of them.
        </SectionHead>
      </div>
      <div className="mt-14 space-y-6 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="cr-marquee" style={{ ['--dur' as string]: `${46 + r * 8}s`, ['--dir' as string]: r ? 'reverse' : 'normal' }}>
            {[...row, ...row].map((deck, i) => (
              <DeckTile key={`${deck.name}-${i}`} deck={deck} tilt={((i * 7) % 5) - 2} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- modes -- */

export function Modes() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="Three ways to play" title="Same cards, three different games.">
        Pick one before the round. Switch whenever the room gets bored.
      </SectionHead>
      <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
        <Reveal rotate={-3} className="cr-mode">
          <div className="cr-mode-card" style={{ background: palette.pink }}>
            <span className="cr-display text-4xl text-white">Barbie</span>
          </div>
          <h3 className="cr-display mt-6 text-2xl">Classic</h3>
          <p className="mt-2 text-white/60">Describe it, hum it, act it out. Anything except saying the word.</p>
        </Reveal>
        <Reveal rotate={2} delay={0.08} className="cr-mode">
          <div className="cr-mode-card flex-col gap-3" style={{ background: palette.red }}>
            <span className="cr-display text-4xl text-white">Pizza</span>
            <div className="flex flex-wrap justify-center gap-1.5 px-4">
              {['cheese', 'slice', 'Italian', 'pepperoni'].map((w) => (
                <span key={w} className="rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-bold text-white line-through decoration-2">
                  {w}
                </span>
              ))}
            </div>
          </div>
          <h3 className="cr-display mt-6 text-2xl">Banned words</h3>
          <p className="mt-2 text-white/60">The words under the card are off limits. Say one and you&apos;re busted. 🚨</p>
        </Reveal>
        <Reveal rotate={-2} delay={0.16} className="cr-mode">
          <div className="cr-mode-card flex-col gap-2" style={{ background: palette.purple }}>
            {['1 · Describe it', '2 · One word', '3 · Act it out'].map((p, i) => (
              <span
                key={p}
                className="cr-display rounded-xl bg-white px-4 py-1.5 text-lg text-[#0A0A0D]"
                style={{ rotate: `${(i - 1) * 3}deg` }}
              >
                {p}
              </span>
            ))}
          </div>
          <h3 className="cr-display mt-6 text-2xl">3 Rounds</h3>
          <p className="mt-2 text-white/60">The same cards come back three times, with fewer words allowed each round. It gets funnier every round.</p>
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- features -- */

const FEATURES = [
  { icon: WifiOff, title: 'Works with no signal', body: 'On a plane, in a basement, in a 95-minute line. No Wi-Fi needed, ever.', color: palette.blue, span: 'md:col-span-2' },
  { icon: Users, title: 'Decks about your group', body: 'Answer five questions about your friends and get a deck only you can play.', color: palette.pink, span: '' },
  { icon: Camera, title: 'Photo cards', body: 'Put faces on cards. Guess who.', color: palette.teal, span: '' },
  { icon: QrCode, title: 'Share with a QR code', body: 'Show a code and the whole room has your deck. Big decks flip through a few codes, or go by AirDrop.', color: palette.yellow, span: 'md:col-span-2' },
  { icon: Shuffle, title: 'Chaos and forfeits', body: 'Accents only. Hum it. Double points. Last place gets a dare.', color: palette.orange, span: '' },
  { icon: Trophy, title: 'Tonight, wrapped', body: 'The MVP, the fastest guess, the card nobody got, in one image to post.', color: palette.purple, span: '' },
  { icon: Smartphone, title: 'Tilt that works', body: 'Tip down for got it, up to pass. Or swipe, or tap.', color: palette.green, span: '' },
  { icon: Moon, title: 'Day or night', body: 'Dark for parties, light for reading in the sun.', color: palette.magenta, span: '' },
]

export function Features() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="What's in it" title="Small app. Lots in it." />
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 md:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body, color, span }, i) => (
          <Reveal key={title} delay={(i % 4) * 0.05} className={`cr-tile ${span}`}>
            <span className="cr-tile-icon" style={{ background: color, color: textOn(color) }}>
              <Icon size={20} strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="cr-display mt-5 text-xl tracking-[-0.02em]">{title}</h3>
            <p className="mt-1.5 text-sm text-white/55">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ AI decks -- */

const AI_CARDS = ['Churro', 'Mouse ears', 'Two-hour line', 'Fireworks', 'Pin trading', 'Turkey leg']

export function AiDecks() {
  return (
    <section id="ai" className="relative px-4 py-28 sm:px-6">
      <div aria-hidden className="cr-ai-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
        <Reveal>
          <p className="cr-kicker">New · make decks with AI</p>
          <h2 className="cr-display mt-3 text-[clamp(2.2rem,5.5vw,4rem)] leading-[0.95] tracking-[-0.035em]">
            Ask Claude for a deck.
            <br />
            <span className="text-[var(--cr-yellow)]">Scan it.</span> Play.
          </h2>
          <p className="mt-5 text-white/60 sm:text-lg">
            Add the free Charades skill to Claude and ask for any deck: your trip, your group chat, your
            office, a show you&apos;re all watching. Claude writes the cards, the banned words and the file.
            Using ChatGPT or Gemini instead? Copy the prompt, then paste what you get into the deck maker
            to turn it into a code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/charades/decks" className="cr-btn cr-btn-primary">
              <Sparkles size={18} aria-hidden />
              Get the Claude skill
            </Link>
            <Link href="/charades/decks#maker" className="cr-btn cr-btn-glass">
              <QrCode size={18} aria-hidden />
              Open the deck maker
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative">
          <div className="cr-chat">
            <div className="cr-bubble cr-bubble-me">
              Make a charades deck about our Disneyland trip. 40 cards, add banned words.
            </div>
            <div className="cr-bubble cr-bubble-ai">
              <p className="text-white/80">Here&apos;s <b className="text-white">Line Legends 🎢</b>, 40 cards with banned words. Open the file on your iPhone, or scan the code.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {AI_CARDS.map((c, i) => (
                  <span
                    key={c}
                    className="cr-display flex aspect-[4/3] items-center justify-center rounded-xl p-1.5 text-center text-[0.95rem] leading-tight sm:text-base"
                    style={{ background: palette.teal, color: INK, rotate: `${(i % 3) - 1}deg` }}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
                <span className="grid size-11 place-items-center rounded-xl bg-[var(--cr-teal)] text-2xl">🎢</span>
                <span className="text-sm">
                  <b className="block text-white">Line Legends.charades</b>
                  <span className="text-white/50">40 cards · opens in Charades</span>
                </span>
              </div>
            </div>
          </div>
          <DexSticker size={96} glyph="✨" className="absolute -right-4 -top-10 rotate-12" bounce />
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- privacy -- */

export function Privacy() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <Reveal className="cr-privacy mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <DexSticker size={110} mood="wow" glyph="🔒" bounce />
          <p className="cr-kicker mt-6">Privacy</p>
          <h2 className="cr-display mt-3 text-[clamp(2.6rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em]">
            Collects <span className="cr-sticker-text">nothing.</span>
          </h2>
          <p className="mt-5 max-w-xl text-balance text-white/60 sm:text-lg">
            No accounts, no analytics, no ads, no tracking, no servers. Your decks, photos and games stay on
            your phone. A test in the code fails the build if anything tries to use the internet.
          </p>
          <Link href="/charades/privacy" className="cr-btn cr-btn-glass mt-8">
            Read the privacy policy
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------------------------------------------------------- open source -- */

export function OpenSource() {
  return (
    <section className="px-4 pb-28 sm:px-6">
      <Reveal className="mx-auto max-w-5xl">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="cr-repo group">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-white text-[#0A0A0D]">
              <GithubMark size={30} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white/50">byw1 / charades</p>
              <p className="cr-display text-2xl tracking-[-0.02em] sm:text-3xl">The whole app is open source.</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-white/60">
            Expo, React Native and TypeScript. Read it, fork it, send a deck or a fix. AGPL-3.0; if you ship a
            fork, give it your own name.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[var(--cr-yellow)]">
            View on GitHub <ArrowUpRight size={18} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </a>
      </Reveal>
    </section>
  )
}
