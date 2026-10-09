import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { TiltCard } from '@/components/ui/tilt-card'
import { ProjectCard, ProjectCardPlaceholder, type Project } from '@/components/ui/project-card'

/** Still in progress: cards without a link until they serve. */
const IN_PROGRESS: Project[] = [
  { rank: 2, name: 'strats.info', status: 'building', accent: ['#8b5cf6', '#6366f1'] },
  { rank: 3, name: 'hired.tools', status: 'building', accent: ['#34d399', '#059669'] },
  { rank: 4, name: 'comms.support', status: 'building', accent: ['#38bdf8', '#0284c7'] },
]

/**
 * Build projects. Deliberately not linked from the homepage: it is a place to
 * send people to, not a section of the site.
 */
export default function BuildsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-black">
      <div className="absolute left-6 top-6 z-10">
        <Link href="/" className="flex items-center gap-2 text-white/70 transition-colors duration-300 hover:text-white">
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-sm tracking-wide">Home</span>
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-col px-6 py-20 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Builds</h1>
        <p className="mt-3 text-sm text-white/50">side projects i&apos;m building</p>

        <div className="my-10 h-px w-16 bg-white/20" />

        <Link
          href="/charades"
          className="group block rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
          style={{ animation: 'project-card-in 640ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
        >
          <TiltCard tiltLimit={6} className="rounded-[28px]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0A0A0D] p-6 sm:p-8">
              <div
                aria-hidden
                className="absolute -right-24 -top-24 size-80 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
                style={{ background: 'radial-gradient(circle, #9B5CFF 0%, transparent 65%)' }}
              />
              <div
                aria-hidden
                className="absolute -bottom-32 left-10 size-72 rounded-full opacity-25 blur-3xl"
                style={{ background: 'radial-gradient(circle, #FFE500 0%, transparent 65%)' }}
              />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <Image
                  src="/charades/icon.png"
                  alt="Charades app icon"
                  width={112}
                  height={112}
                  className="rounded-[26px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#FFE500]/30 bg-[#FFE500]/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#FFE500]">
                      iPhone · coming soon
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/50">
                      open source
                    </span>
                  </div>
                  <h2 className="mt-3 flex items-center gap-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Charades
                    <ArrowUpRight
                      size={22}
                      className="text-white/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                      aria-hidden
                    />
                  </h2>
                  <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/55">
                    A forehead-card party game where you make your own decks. Built because the ones we played
                    in line at Disneyland were bad. Offline, no ads, no accounts.
                  </p>
                </div>
              </div>
            </div>
          </TiltCard>
        </Link>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {IN_PROGRESS.map((project, i) => (
            <ProjectCard key={project.name} project={project} index={i + 1} />
          ))}
          <ProjectCardPlaceholder index={IN_PROGRESS.length + 1} />
        </div>
      </main>
    </div>
  )
}
