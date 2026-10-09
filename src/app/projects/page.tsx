import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProjectCard, ProjectCardPlaceholder, type Project } from '@/components/ui/project-card'

/**
 * Every project gets the identical card. Copy for the live ones is taken
 * from each product's own site description.
 */
const PROJECTS: Project[] = [
  {
    rank: 1,
    name: 'Charades',
    href: '/charades',
    status: 'soon',
    statusLabel: 'iPhone · soon',
    tagline:
      'A forehead-card party game where you make your own decks. Offline, no ads, no accounts.',
    accent: ['#9B5CFF', '#FFE500'],
    icon: '/projects/charades.png',
    tags: ['iOS', 'open source'],
  },
  {
    rank: 2,
    name: 'Hired',
    href: 'https://hired.tools',
    status: 'live',
    tagline:
      'The ATS for applicants. Theirs keeps a record on you; this one keeps the record on them.',
    accent: ['#e4e4e7', '#71717a'],
    icon: '/projects/hired.png',
    tags: ['web', 'self-host'],
  },
  {
    rank: 3,
    name: 'Comms',
    href: 'https://comms.support',
    status: 'live',
    tagline:
      'A shared team inbox for iMessage, with a help desk built in — tickets, macros, replying together.',
    accent: ['#60a5fa', '#818cf8'],
    icon: '/projects/comms.png',
    tags: ['web', 'open source'],
  },
  {
    rank: 4,
    name: 'strats.info',
    status: 'building',
    tagline: 'In the works.',
    accent: ['#8b5cf6', '#6366f1'],
  },
]

export default function ProjectsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.14), transparent 70%)' }}
      />

      <div className="absolute left-6 top-6 z-10">
        <Link href="/" className="flex items-center gap-2 text-white/70 transition-colors duration-300 hover:text-white">
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-sm tracking-wide">Home</span>
        </Link>
      </div>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col px-5 py-20 sm:px-8">
        <p className="invite-rise text-[11px] uppercase tracking-[0.3em] text-white/40">selected work</p>
        <h1 className="invite-rise mt-3 text-4xl font-bold tracking-tight text-white sm:text-6xl" style={{ animationDelay: '80ms' }}>
          Projects
        </h1>
        <p className="invite-rise mt-3 max-w-md text-sm text-white/50" style={{ animationDelay: '160ms' }}>
          things i&apos;m building — the live ones open, the rest are on the way.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.name} project={project} index={i} />
          ))}
          <ProjectCardPlaceholder index={PROJECTS.length} />
        </div>
      </main>
    </div>
  )
}
