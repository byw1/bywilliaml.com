'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  ProjectCard,
  ProjectCardPlaceholder,
  type Project,
} from '@/components/ui/project-card'

/**
 * Ordered by rank — index 0 is the headline project.
 * When a domain starts serving, set `status: 'live'` and give it an `href`;
 * the card turns into a real link on its own.
 */
const PROJECTS: Project[] = [
  {
    rank: 1,
    name: 'strats.info',
    status: 'building',
    accent: ['#8b5cf6', '#6366f1'],
  },
  {
    rank: 2,
    name: 'hired.tools',
    status: 'building',
    accent: ['#34d399', '#059669'],
  },
  {
    rank: 3,
    name: 'comms.support',
    status: 'building',
    accent: ['#38bdf8', '#0284c7'],
  },
]

export default function ProjectsTestPage() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-black">
      <div className="absolute left-6 top-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/70 transition-colors duration-300 hover:text-white"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-sm tracking-wide">Home</span>
        </Link>
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-col px-6 py-20 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">Projects</h1>
        <p className="mt-3 text-sm text-white/50">things i&apos;m building</p>

        <div className="my-10 h-px w-16 bg-white/20" />

        {/* Two columns keeps an even card count square — 3 projects plus the
            "more soon" slot lands as a clean 2x2. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.name} project={project} index={i} />
          ))}
          <ProjectCardPlaceholder index={PROJECTS.length} />
        </div>
      </main>
    </div>
  )
}
