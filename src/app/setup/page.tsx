import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SetupView } from '@/components/setup/setup-view'

export const metadata: Metadata = {
  title: 'Setup — William L',
  description: 'My desk, in 3D: the monitors, peripherals and chair I use every day and recommend.',
}

export default function SetupPage() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-clip bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 0%, rgba(124,58,237,0.16), transparent 70%)' }}
      />
      <div className="absolute left-6 top-6 z-10">
        <Link href="/about" className="flex items-center gap-2 text-white/70 transition-colors duration-300 hover:text-white">
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-sm tracking-wide">About</span>
        </Link>
      </div>

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6">
        <header className="mb-8 px-1">
          <p className="invite-rise text-[11px] uppercase tracking-[0.3em] text-white/40">the workstation</p>
          <h1 className="invite-rise mt-3 text-4xl font-bold tracking-tight text-white sm:text-6xl" style={{ animationDelay: '80ms' }}>
            My Setup
          </h1>
          <p className="invite-rise mt-3 max-w-lg text-sm leading-relaxed text-white/50" style={{ animationDelay: '160ms' }}>
            everything on my desk, and the peripherals i&apos;d tell anyone to buy. spin the room, tap a number to fly to it.
          </p>
        </header>
        <SetupView />
      </main>
    </div>
  )
}
