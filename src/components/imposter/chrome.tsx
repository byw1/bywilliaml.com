import Link from 'next/link'
import { GithubMark } from '@/components/charades/github-mark'
import { ShadeSticker } from './shade-sticker'
import { GITHUB_URL, ISSUES_URL } from './data'

export function Wordmark() {
  return (
    <Link href="/imposter" className="flex items-center gap-2" aria-label="Imposter home">
      <ShadeSticker size={36} />
      <span className="im-display text-xl tracking-[-0.03em]">Imposter</span>
    </Link>
  )
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav className="im-nav mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Wordmark />
        <div className="flex items-center gap-1 text-sm font-semibold text-white/70">
          <Link href="/imposter#how" className="hidden rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white md:block">
            How to play
          </Link>
          <Link href="/imposter#topics" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
            Topics
          </Link>
          <Link href="/imposter/privacy" className="hidden rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white sm:block">
            Privacy
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[#0C0A10] transition hover:bg-[var(--im-lime)]"
          >
            <GithubMark size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-sm text-sm text-white/45">
            The hidden-word party game, and Charades&apos; sibling. Made by{' '}
            <Link href="/" className="text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white">
              William L.
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/60">
          <Link href="/imposter/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/charades" className="hover:text-white">
            Charades
          </Link>
          <a href={ISSUES_URL} target="_blank" rel="noreferrer" className="hover:text-white">
            Support
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white">
            GitHub
          </a>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-white/30">
        © 2026 William Lee. Imposter is an independent app and isn&apos;t affiliated with any other party game.
      </p>
    </footer>
  )
}
