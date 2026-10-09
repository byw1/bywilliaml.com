import { Hero } from '@/components/charades/hero'
import { PhoneDemo } from '@/components/charades/phone-demo'
import { AiDecks, DeckWall, Features, Modes, OpenSource, Privacy, SectionHead, Story } from '@/components/charades/sections'

export default function CharadesPage() {
  return (
    <main>
      <Hero />

      <section id="how" className="relative px-4 py-28 sm:px-6">
        <SectionHead kicker="How to play" title="Tip down if you got it. Up to pass.">
          One person holds the phone to their forehead. Everyone else can see the card and yells clues. Try it:
        </SectionHead>
        <div className="mx-auto mt-14 max-w-3xl">
          <PhoneDemo />
        </div>
      </section>

      <Story />
      <DeckWall />
      <Modes />
      <Features />
      <AiDecks />
      <Privacy />
      <OpenSource />
    </main>
  )
}
