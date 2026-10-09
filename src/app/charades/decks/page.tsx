import type { Metadata } from 'next'
import { Download } from 'lucide-react'
import { CopyBlock } from '@/components/charades/copy-block'
import { DeckMaker } from '@/components/charades/deck-maker'
import { DexSticker } from '@/components/charades/dex-sticker'
import { GithubMark } from '@/components/charades/github-mark'
import { Reveal } from '@/components/charades/reveal'
import { GITHUB_URL, SKILL_ZIP } from '@/components/charades/data'

export const metadata: Metadata = {
  title: 'Make decks with AI',
  description:
    'Add the free Charades skill to Claude, or paste any AI’s cards into the deck maker, and get a deck you can scan straight into the app.',
}

const PROMPT = `Make a deck for the party game Charades, where one player holds a phone to their forehead and everyone else yells clues.

Theme: [WHAT THE DECK IS ABOUT: your trip, your friends, a show, your office]
Cards: 40

Rules for the cards:
- 1 to 4 words each, never more than 60 characters.
- Things most of my group would know. About 60% easy, 30% medium, 10% hard.
- Things you can describe, hum or act out. No duplicates.
- For each card, up to 5 "banned" words: the most obvious clues, never the card's own words.

Reply with only this JSON, in one code block:
{
  "name": "Deck name, up to 60 characters",
  "description": "One line about the deck",
  "emoji": "one emoji for the cover",
  "color": "pink, purple, blue, teal, red, yellow, indigo or magenta",
  "cards": [
    { "text": "Card", "banned": ["word", "word", "word"] }
  ]
}`

const STEPS = [
  {
    title: 'Download the skill',
    body: 'One small zip: instructions for Claude and a script that packs the deck the way the app shares decks.',
  },
  {
    title: 'Add it to Claude',
    body: 'In Claude, open Settings, turn on code execution, then upload the zip under Skills. In Claude Code, unzip it into ~/.claude/skills.',
  },
  {
    title: 'Ask for a deck',
    body: '“Make a charades deck about our ski trip, 50 cards, with banned words.” Claude writes the cards and hands back a .charades file and a scan link.',
  },
]

export default function CharadesDecksPage() {
  return (
    <main className="px-4 pb-24 pt-32 sm:px-6">
      <section className="mx-auto max-w-5xl">
        <Reveal className="flex flex-col items-center text-center">
          <DexSticker size={110} mood="excited" glyph="✨" bounce />
          <p className="cr-kicker mt-6">Make decks with AI</p>
          <h1 className="cr-display mt-3 text-[clamp(2.6rem,8vw,5.2rem)] leading-[0.92] tracking-[-0.04em]">
            Any deck you can <span className="cr-sticker-text">describe.</span>
          </h1>
          <p className="mt-5 max-w-xl text-balance text-white/60 sm:text-lg">
            Your group chat, your trip, your office, the show you&apos;re all watching. Let Claude or any other AI
            write the cards, then scan them into Charades.
          </p>
        </Reveal>
      </section>

      {/* ---- Claude skill ---- */}
      <section className="mx-auto mt-24 max-w-5xl">
        <Reveal>
          <div className="rounded-[36px] border border-[var(--cr-line)] bg-[radial-gradient(70%_90%_at_0%_0%,rgba(255,229,0,0.12),transparent_70%)] p-6 sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="cr-kicker">For Claude</p>
                <h2 className="cr-display mt-2 text-[clamp(2rem,5vw,3.2rem)] leading-none tracking-[-0.035em]">The Charades skill</h2>
                <p className="mt-3 max-w-lg text-white/60">
                  Teaches Claude how to write a good deck and how to pack it into a file the app opens. Free, and
                  open source like the app.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={SKILL_ZIP} download className="cr-btn cr-btn-primary">
                  <Download size={18} aria-hidden />
                  Download the skill
                </a>
                <a href={`${GITHUB_URL}/tree/main/skill/charades-deck-maker`} target="_blank" rel="noreferrer" className="cr-btn cr-btn-glass">
                  <GithubMark size={16} />
                  Source
                </a>
              </div>
            </div>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-3xl bg-[var(--cr-surface)] p-5">
                  <span className="cr-display grid size-10 place-items-center rounded-xl bg-[var(--cr-yellow)] text-xl text-[#0A0A0D] shadow-[0_0_0_3px_#0A0A0D,0_0_0_6px_#fff]">
                    {i + 1}
                  </span>
                  <h3 className="cr-display mt-5 text-xl">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-white/55">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* ---- Any AI ---- */}
      <section className="mx-auto mt-24 max-w-5xl">
        <Reveal>
          <p className="cr-kicker">For ChatGPT, Gemini or anything else</p>
          <h2 className="cr-display mt-2 text-[clamp(2rem,5vw,3.2rem)] leading-none tracking-[-0.035em]">Copy this prompt.</h2>
          <p className="mt-3 max-w-2xl text-white/60">
            Fill in the theme, paste it into your AI of choice, then paste its answer into the deck maker below.
          </p>
          <div className="mt-6">
            <CopyBlock text={PROMPT} />
          </div>
        </Reveal>
      </section>

      {/* ---- Maker ---- */}
      <section id="maker" className="mx-auto mt-24 max-w-5xl scroll-mt-28">
        <Reveal>
          <p className="cr-kicker">Deck maker</p>
          <h2 className="cr-display mt-2 text-[clamp(2rem,5vw,3.2rem)] leading-none tracking-[-0.035em]">Paste it. Scan it. Play.</h2>
          <p className="mt-3 max-w-2xl text-white/60">
            Paste the JSON from any AI, code fences and all, or a plain list of cards. You get a code to scan, a
            .charades file to AirDrop and a link to share.
          </p>
        </Reveal>
        <div className="mt-6">
          <DeckMaker />
        </div>
      </section>
    </main>
  )
}
