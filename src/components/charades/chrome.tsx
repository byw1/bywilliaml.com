import Link from 'next/link'
import { DexSticker } from './dex-sticker'
import { GithubMark } from './github-mark'
import { GITHUB_URL, ISSUES_URL } from './data'

export function Wordmark() {
  return (
    <Link href="/charades" className="flex items-center gap-2" aria-label="Charades home">
      <DexSticker size={34} />
      <span className="cr-display text-xl tracking-[-0.03em]">Charades</span>
    </Link>
  )
}

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav className="cr-nav mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Wordmark />
        <div className="flex items-center gap-1 text-sm font-semibold text-white/70">
          <Link href="/charades#how" className="hidden rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white md:block">
            How to play
          </Link>
          <Link href="/charades#decks" className="hidden rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white md:block">
            Decks
          </Link>
          <Link href="/charades/decks" className="rounded-full px-3 py-1.5 transition hover:bg-white/10 hover:text-white">
            AI decks
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[#0A0A0D] transition hover:bg-[var(--cr-yellow)]"
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
            A forehead-card party game. Made by{' '}
            <Link href="/" className="text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white">
              William L.
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/60">
          <Link href="/charades/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/charades/decks" className="hover:text-white">
            AI decks
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
        © 2026 William L. Charades: Make Your Own Decks is an independent app and isn&apos;t affiliated
        with any theme park or other party game.
      </p>
    </footer>
  )
}
