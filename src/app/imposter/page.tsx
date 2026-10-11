import { Hero } from '@/components/imposter/hero'
import { TableDemo } from '@/components/imposter/table-demo'
import { FairPlay, Features, HouseRules, Privacy, Round, SectionHead, Source, TopicWall } from '@/components/imposter/sections'

export default function ImposterPage() {
  return (
    <main>
      <Hero />

      <section id="how" className="relative px-4 py-28 sm:px-6">
        <SectionHead kicker="How to play" title="Everyone knows the word. Except one.">
          Pass the phone, peek at your card, and give a one-word clue. Try a round with four friends:
        </SectionHead>
        <div className="mx-auto mt-14 max-w-4xl">
          <TableDemo />
        </div>
      </section>

      <Round />
      <TopicWall />
      <HouseRules />
      <FairPlay />
      <Features />
      <Privacy />
      <Source />
    </main>
  )
}
