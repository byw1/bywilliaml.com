import Link from 'next/link'
import { ArrowUpRight, Dices, Moon, PenLine, RotateCcw, Timer, Trophy, Users, WifiOff } from 'lucide-react'
import { GithubMark } from '@/components/charades/github-mark'
import { Reveal } from '@/components/charades/reveal'
import { ShadeSticker } from './shade-sticker'
import { GITHUB_URL, INK, palette, textOn, TOPICS, type BundledTopic } from './data'

export function SectionHead({ kicker, title, children }: { kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="im-kicker">{kicker}</p>
      <h2 className="im-display mt-3 text-[clamp(2.2rem,6vw,4.2rem)] leading-[0.95] tracking-[-0.035em]">{title}</h2>
      {children ? <p className="mt-4 text-balance text-white/60 sm:text-lg">{children}</p> : null}
    </Reveal>
  )
}

/* ------------------------------------------------------------ the round -- */

const STEPS = [
  { title: 'Set up once', body: 'Add everyone in the order you’re sitting. Pick topics and house rules.', color: palette.purple },
  { title: 'Pass and peek', body: 'Each player holds to see their card: the word, or “Imposter”. Let go and it’s face down.', color: palette.teal },
  { title: 'Clues', body: 'The phone sits in the middle and calls each player in turn: “Maya, one word.”', color: palette.yellow },
  { title: 'Talk it out', body: 'A quiet timer and a nudge now and then: “Who was too vague?” +30 seconds if it’s getting good.', color: palette.orange },
  { title: 'Vote', body: 'Everyone points on 3, 2, 1, or a secret vote counted out one dot at a time. Ties revote.', color: palette.indigo },
  { title: 'Reveal', body: 'Drumroll. Shade trembles. The censor bar slides off: in, or the imposter.', color: palette.magenta },
  { title: 'The steal', body: 'A caught imposter picks the word from a handful in the same topic. Right, and they steal the win.', color: palette.red },
  { title: 'Verdict', body: 'Blue for “Caught!”, Shade’s red for “Got away”. Then the word, who scored, and tonight’s table.', color: palette.blue },
]

export function Round() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="A round, start to finish" title="Eight steps. About five minutes.">
        The game saves at every step, so if someone closes the app mid-vote it picks up on the same screen.
      </SectionHead>
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={(i % 4) * 0.05} className="im-step">
            <span className="im-step-num" style={{ background: step.color, color: textOn(step.color) }}>
              {i + 1}
            </span>
            <h3 className="im-display mt-5 text-xl tracking-[-0.02em]">{step.title}</h3>
            <p className="mt-1.5 text-sm text-white/55">{step.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- topic wall -- */

function TopicTile({ topic, tilt, at }: { topic: BundledTopic; tilt: number; at: number }) {
  const fg = textOn(topic.color)
  return (
    <div className="im-topic" style={{ background: topic.color, color: fg, ['--tilt' as string]: `${tilt}deg` }}>
      <span aria-hidden className="im-role-blob -left-20 -top-24 size-48" />
      <span className="im-topic-emoji relative">{topic.emoji}</span>
      <span className="im-display relative mt-auto text-[1.6rem] leading-[1] tracking-[-0.02em]">{topic.name}</span>
      <span className="relative mt-1 text-xs font-bold uppercase tracking-[0.16em] opacity-70">50 words</span>
      <span className="im-topic-word" style={{ color: INK }}>
        {topic.words[at % topic.words.length]}
      </span>
    </div>
  )
}

export function TopicWall() {
  const half = Math.ceil(TOPICS.length / 2)
  const rows = [TOPICS.slice(0, half), TOPICS.slice(half)]
  return (
    <section id="topics" className="relative overflow-hidden py-28">
      <div className="px-4 sm:px-6">
        <SectionHead kicker="12 topics · 600 words" title="Every topic is free.">
          Food, Animals, Places, Jobs, Movies &amp; TV and more. Hover a topic to peek at a word. Or make your
          own: inside jokes, your town, your group chat. Paste a list from anywhere.
        </SectionHead>
      </div>
      <div className="mt-14 space-y-6 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        {rows.map((row, r) => (
          <div key={r} className="im-marquee" style={{ ['--dur' as string]: `${42 + r * 8}s`, ['--dir' as string]: r ? 'reverse' : 'normal' }}>
            {[...row, ...row].map((topic, i) => (
              <TopicTile key={`${topic.name}-${i}`} topic={topic} at={i} tilt={((i * 7) % 5) - 2} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------- house rules -- */

export function HouseRules() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="House rules" title="Your table, your rules.">
        Set them once and they stick for the night.
      </SectionHead>
      <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
        <Reveal rotate={-3} className="im-mode">
          <div className="im-mode-card gap-2" style={{ background: palette.purple }}>
            {['1', '2', '3', '🎲'].map((n, i) => (
              <span
                key={n}
                className="im-display grid size-12 place-items-center rounded-xl text-2xl"
                style={{ background: i === 3 ? palette.lime : '#fff', color: INK, rotate: `${(i - 1.5) * 4}deg` }}
              >
                {n}
              </span>
            ))}
          </div>
          <h3 className="im-display mt-6 text-2xl">How many imposters</h3>
          <p className="mt-2 text-white/60">One to three. Or 🎲 surprise, and nobody knows how many there are.</p>
        </Reveal>
        <Reveal rotate={2} delay={0.08} className="im-mode">
          <div className="im-mode-card flex-col gap-2" style={{ background: palette.teal }}>
            <span className="text-xs font-extrabold tracking-[0.12em] text-[#0C0A10]">🦁 ANIMALS</span>
            <span className="im-display text-4xl text-[#0C0A10]">Imposter</span>
            <span className="rounded-full bg-black/20 px-3 py-0.5 text-xs font-bold text-[#0C0A10]">hint on</span>
          </div>
          <h3 className="im-display mt-6 text-2xl">Hint or no hint</h3>
          <p className="mt-2 text-white/60">Let imposters see the topic, or send them in blind. 1 to 3 clues each.</p>
        </Reveal>
        <Reveal rotate={-2} delay={0.16} className="im-mode">
          <div className="im-mode-card flex-col gap-3" style={{ background: palette.orange }}>
            <span className="im-display text-4xl text-[#0C0A10]">3 · 2 · 1</span>
            <div className="flex gap-1.5">
              {[1, 1, 1, 0, 0].map((on, i) => (
                <span key={i} className="size-3.5 rounded-full border-2 border-[#0C0A10]" style={{ background: on ? INK : 'transparent' }} />
              ))}
            </div>
          </div>
          <h3 className="im-display mt-6 text-2xl">Point or secret vote</h3>
          <p className="mt-2 text-white/60">Point together, or pass the phone and count the votes out one dot at a time.</p>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ fair play -- */

export function FairPlay() {
  return (
    <section className="px-4 py-12 sm:px-6">
      <Reveal className="im-fair mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[auto_1fr]">
        <div className="relative mx-auto">
          <div className="flex -space-x-10">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid h-36 w-24 place-items-center rounded-2xl border border-white/10 bg-[var(--im-raised)] shadow-xl"
                style={{ rotate: `${(i - 1) * 9}deg`, translate: `0 ${i === 1 ? -8 : 0}px` }}
              >
                <span className="im-redact h-5 w-14" />
              </div>
            ))}
          </div>
          <ShadeSticker size={84} mood="peek" className="absolute -bottom-8 -right-8 rotate-6" bounce />
        </div>
        <div>
          <p className="im-kicker">Nothing gives you away</p>
          <h2 className="im-display mt-3 text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.95] tracking-[-0.035em]">Every card looks the same.</h2>
          <p className="mt-4 text-white/60 sm:text-lg">
            The card is the topic&apos;s colour for everyone. The reveal sound and the buzz are identical, in or
            imposter, and the card goes face down the instant your thumb lifts. The only tell at the table is you.
          </p>
        </div>
      </Reveal>
    </section>
  )
}

/* -------------------------------------------------------------- features -- */

const FEATURES = [
  { icon: WifiOff, title: 'Works with no signal', body: 'Nothing to download after install. No Wi-Fi needed, ever.', color: palette.blue, span: 'md:col-span-2' },
  { icon: Users, title: '3 to 12 players', body: 'One phone, passed round. Friends and family.', color: palette.purple, span: '' },
  { icon: PenLine, title: 'Your own topics', body: 'Paste a list from anywhere.', color: palette.yellow, span: '' },
  { icon: Trophy, title: 'Bragging rights', body: 'Tonight’s table after every round, and all-time: best liar, best detective, word thief.', color: palette.orange, span: 'md:col-span-2' },
  { icon: RotateCcw, title: 'Resume anything', body: 'Close it mid-vote. It picks up on the same screen.', color: palette.teal, span: '' },
  { icon: Timer, title: 'Talk timer', body: 'Off to 3 minutes, and +30 seconds when it’s good.', color: palette.magenta, span: '' },
  { icon: Dices, title: 'Random start seat', body: 'A different player goes first every round.', color: palette.lime, span: '' },
  { icon: Moon, title: 'Day or night', body: 'Dark and light themes, and reduced motion respected.', color: palette.indigo, span: '' },
]

export function Features() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="What's in it" title="Small app. Lots in it." />
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 md:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body, color, span }, i) => (
          <Reveal key={title} delay={(i % 4) * 0.05} className={`im-tile ${span}`}>
            <span className="im-tile-icon" style={{ background: color, color: textOn(color) }}>
              <Icon size={20} strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="im-display mt-5 text-xl tracking-[-0.02em]">{title}</h3>
            <p className="mt-1.5 text-sm text-white/55">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- privacy -- */

export function Privacy() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <Reveal className="im-privacy mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <ShadeSticker size={110} mood="wink" glyph="🔒" bounce />
          <p className="im-kicker mt-6">Privacy</p>
          <h2 className="im-display mt-3 text-[clamp(2.6rem,8vw,6rem)] leading-[0.9] tracking-[-0.04em]">
            Collects <span className="im-sticker-text">nothing.</span>
          </h2>
          <p className="mt-5 max-w-xl text-balance text-white/60 sm:text-lg">
            No accounts, no analytics, no ads, no tracking, no servers, and no permissions to ask for. Names,
            topics and stats stay on your phone. A test in the code fails the build if anything tries to use
            the internet.
          </p>
          <Link href="/imposter/privacy" className="im-btn im-btn-glass mt-8">
            Read the privacy policy
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------------------------------------------------------------- source -- */

export function Source() {
  return (
    <section className="px-4 pb-28 sm:px-6">
      <Reveal className="mx-auto grid max-w-5xl gap-5 md:grid-cols-[1.4fr_1fr]">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="im-repo group">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-white text-[#0C0A10]">
              <GithubMark size={30} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white/50">byw1 / imposter</p>
              <p className="im-display text-2xl tracking-[-0.02em] sm:text-3xl">Read the whole app.</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-white/60">
            Expo, React Native and TypeScript. The game rules are plain, tested TypeScript, and a lint rule
            plus a test keep the network out for good.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[var(--im-lime)]">
            View on GitHub <ArrowUpRight size={18} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </a>
        <Link href="/charades" className="im-repo group" style={{ background: 'linear-gradient(135deg, rgba(155,92,255,0.22), rgba(255,229,0,0.06) 60%, transparent), var(--im-surface)' }}>
          <p className="text-sm font-semibold text-white/50">Its sibling</p>
          <p className="im-display mt-1 text-2xl tracking-[-0.02em] sm:text-3xl">Charades</p>
          <p className="mt-3 text-white/60">Phone on your forehead, friends yell clues. Same look, same no-ads rules.</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold text-[#FFE500]">
            Meet Dex <ArrowUpRight size={18} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      </Reveal>
    </section>
  )
}
