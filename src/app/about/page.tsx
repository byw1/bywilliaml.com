'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import PolaroidStack, { type PolaroidItem } from '@/components/ui/polaroid-stack'
import { TiltCard } from '@/components/ui/tilt-card'
import { PerspectiveBook, BookTitle } from '@/components/ui/perspective-book'
import { AnimatedFolder } from '@/components/ui/animated-folder'

const BOOKS = [
  { title: 'Principles — Ray Dalio', color: 'bg-gradient-to-br from-[#0d1117] to-[#1a2332] text-blue-300' },
  { title: 'Steve Jobs — Walter Isaacson', color: 'bg-gradient-to-br from-[#1a1a1a] to-[#2d1a1a] text-white' },
  { title: 'Elon Musk — Walter Isaacson', color: 'bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] text-violet-300' },
  { title: 'Good to Great — Jim Collins', color: 'bg-gradient-to-br from-[#1a2e1a] to-[#0d1a0d] text-emerald-300' },
  { title: 'The Republic — Plato', color: 'bg-gradient-to-br from-[#2d2a1a] to-[#1a1700] text-amber-300' },
  { title: 'Your Next Five Moves — Patrick Bet-David', color: 'bg-gradient-to-br from-[#2d1a1a] to-[#1a0d0d] text-orange-300' },
]

function BookCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let raf: number
    const speed = 0.5

    const step = () => {
      if (!paused && el) {
        el.scrollLeft += speed
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0
        }
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paused])

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' })
  }

  const doubled = [...BOOKS, ...BOOKS]

  return (
    <div
      className="relative w-full max-w-2xl"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-black to-transparent" />

      {/* Nav buttons */}
      <button
        onClick={() => scrollBy(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={() => scrollBy(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>

      {/* Scroll track */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-4 px-10"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex gap-6 w-max">
          {doubled.map((book, i) => (
            <div key={`${book.title}-${i}`} className="flex-shrink-0">
              <PerspectiveBook size="sm" className={book.color}>
                <div className="flex flex-col h-full justify-end">
                  <BookTitle className="text-[11px] leading-tight">{book.title}</BookTitle>
                </div>
              </PerspectiveBook>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const polaroids: PolaroidItem[] = [
  {
    src: '/william.jpg',
    caption: 'William Lee',
  },
  {
    src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    caption: 'under the stars',
  },
  {
    src: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1200&auto=format&fit=crop',
    caption: 'golden hour',
  },
  {
    src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1200&auto=format&fit=crop',
    caption: 'lost in the woods',
  },
  {
    src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1200&auto=format&fit=crop',
    caption: 'sunday walks',
  },
]

export default function AboutPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen h-full flex flex-col items-center font-light relative w-full bg-black overflow-x-hidden">
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} />
          <span className="text-sm tracking-wide">Back</span>
        </Link>
      </div>

      <div
        className={`flex flex-col items-center justify-center flex-1 w-full max-w-2xl px-5 sm:px-8 py-20 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <PolaroidStack items={polaroids} />

        <p className="text-white/40 text-xs tracking-widest uppercase mt-2 mb-10">
          drag to flip through
        </p>

        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 tracking-tight">About Me</h1>

        <div className="space-y-5 text-white/80 text-sm sm:text-lg leading-relaxed text-left sm:text-center">
          <p>
            I was born in 2000, and honestly, I&apos;m still figuring out my life. I&apos;ve had a
            lot of unique experiences that shaped who I am — and it&apos;s honestly a pretty
            wild ride.
          </p>
          <p>
            It&apos;s everything from being 13 years old and running the largest Skyblock server,
            to something as rough as getting expelled from middle school, to leaving high school
            and graduating a year early.
          </p>
          <p>
            I ran a business networking club that interviewed leaders at companies like
            Dave&apos;s Hot Chicken and grew to over 100,000 members on Clubhouse. I launched my
            first real successful business at 19 years old, surpassing $100,000 in the first 16
            days. I&apos;ve helped a multitude of friends in varying capacities launch multi-six
            and even a few multi-seven figure businesses.
          </p>
          <p>
            To get a better understanding of who I am, I&apos;d definitely recommend reading
            my{' '}
            <a
              href="https://bywilliaml.substack.com/archive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-4 hover:text-white/60 transition-colors"
            >
              blog
            </a>
            . But here&apos;s some more things about me.
          </p>
        </div>

        <div className="w-16 h-px bg-white/20 my-10" />

        <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden">

          {/* Numerology — big glowing number */}
          <TiltCard className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 text-center">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">numerology</p>
            <div className="relative inline-block">
              <span
                className="text-6xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(180deg, #c084fc 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                33
              </span>
              <div className="absolute inset-0 blur-2xl opacity-30 bg-purple-500 rounded-full" />
            </div>
            <p className="text-white/50 text-xs mt-2">master number</p>
          </TiltCard>

          {/* Myers-Briggs — dimension sliders */}
          <TiltCard className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 text-xs uppercase tracking-widest">myers-briggs</p>
              <span className="text-blue-400 text-sm font-semibold">INTJ-A</span>
            </div>
            <div className="space-y-3">
              {[
                { left: 'E', right: 'I', value: 85, label: 'Introverted' },
                { left: 'S', right: 'N', value: 80, label: 'Intuitive' },
                { left: 'F', right: 'T', value: 75, label: 'Thinking' },
                { left: 'P', right: 'J', value: 70, label: 'Judging' },
              ].map((dim) => (
                <div key={dim.label}>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-[10px] w-3 text-center font-mono">{dim.left}</span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${dim.value}%` }}
                      />
                    </div>
                    <span className="text-blue-400 text-[10px] w-3 text-center font-mono font-bold">{dim.right}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/50 text-xs mt-3 text-center">Assertive Architect</p>
          </TiltCard>

          {/* Principles You — The Shaper */}
          <TiltCard className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">principles you</p>
            <p
              className="text-3xl font-bold text-center mb-3"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The Shaper
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Independent', 'Determined', 'Practical', 'Driven', 'Unconventional'].map((t) => (
                <span key={t} className="text-[10px] uppercase tracking-wider text-amber-400/70 bg-amber-400/[0.08] rounded-full px-3 py-1">
                  {t}
                </span>
              ))}
            </div>
          </TiltCard>

          {/* Hogwarts House — Slytherin */}
          <TiltCard
            className="rounded-2xl border p-5 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(21,71,52,0.3) 0%, rgba(10,35,25,0.3) 100%)',
              borderColor: 'rgba(34,197,94,0.15)',
            }}
          >
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">hogwarts house</p>
            <p className="text-3xl mb-1">🐍</p>
            <p
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(180deg, #86efac 0%, #166534 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Slytherin
            </p>
            <p className="text-white/40 text-xs mt-2 italic">though I know nothing about Harry Potter</p>
          </TiltCard>

          {/* Political Compass — actual graph (full width) */}
          <TiltCard className="sm:col-span-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4">political compass</p>
            <div className="relative w-40 sm:w-48 h-40 sm:h-48 mx-auto my-4">
              <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#7c3aed]/10 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#3b82f6]/10 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#22c55e]/10 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#eab308]/10 rounded-br-lg" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full text-[9px] text-white/30">Left</span>
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full text-[9px] text-white/30">Right</span>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[9px] text-white/30">Auth</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full text-[9px] text-white/30">Lib</span>
              <div
                className="absolute w-3 h-3 rounded-full bg-emerald-400 border-2 border-white"
                style={{
                  left: `${50 + (0.63 / 10) * 50}%`,
                  top: `${50 + (1.74 / 10) * 50}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 12px rgba(52, 211, 153, 0.6)',
                }}
              />
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span className="text-white/50 text-xs">Economic <span className="text-emerald-400">+0.63</span></span>
              <span className="text-white/20">·</span>
              <span className="text-white/50 text-xs">Social <span className="text-emerald-400">-1.74</span></span>
            </div>
          </TiltCard>

        </div>

        <div className="w-16 h-px bg-white/20 my-10" />

        {/* Favorite Books */}
        <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Favorite Books</h2>
        <BookCarousel />

        <div className="w-16 h-px bg-white/20 my-10" />

        {/* Random Favorites */}
        <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Random Favorites</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full max-w-lg">
          <AnimatedFolder
            title="YouTube Channels"
            folderColor="#8b5cf6"
            href="/youtube-channels"
            items={[
              { id: 'p1', title: 'All-In Podcast', color: 'linear-gradient(135deg, #1a1a2e, #2d1a3e)' },
              { id: 'p2', title: 'Harvard Business School', color: 'linear-gradient(135deg, #2d1a1a, #3e1a1a)' },
              { id: 'p3', title: 'Kurzgesagt', color: 'linear-gradient(135deg, #0d1a2e, #1a2e3e)' },
            ]}
          />
          <AnimatedFolder
            title="Movies & Shows"
            folderColor="#ef4444"
            href="https://www.imdb.com/user/p.posf2ez26r3fk5jjlduldg7xpe/ratings/?ref_=up_hd_ql_urrat&sort=top_rated%2Cdesc"
            items={[
              { id: 'm1', title: 'Landman', color: 'linear-gradient(135deg, #2d2a1a, #1a1700)' },
              { id: 'm2', title: 'Silicon Valley', color: 'linear-gradient(135deg, #0d1117, #1a1a2e)' },
              { id: 'm3', title: 'In Time', color: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
            ]}
          />
          <AnimatedFolder
            title="Videogames"
            folderColor="#3b82f6"
            items={[
              { id: 'g1', title: 'Minecraft', color: 'linear-gradient(135deg, #1a2e1a, #2d4a1a)' },
              { id: 'g2', title: 'Balatro', color: 'linear-gradient(135deg, #2d1a1a, #3e1a2a)' },
              { id: 'g3', title: 'Satisfactory', color: 'linear-gradient(135deg, #2d2a1a, #1a2e1a)' },
            ]}
          />
          <AnimatedFolder
            title="Music"
            folderColor="#22c55e"
            href="https://music.apple.com/profile/bywilliaml"
            items={[
              { id: 'mu1', title: 'Kanye West', color: 'linear-gradient(135deg, #1a1a1a, #2d2a1a)' },
              { id: 'mu2', title: 'Gorillaz', color: 'linear-gradient(135deg, #1a1a2e, #0d2e1a)' },
              { id: 'mu3', title: 'Tucker Wetmore', color: 'linear-gradient(135deg, #2d1a1a, #1a2e2e)' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
