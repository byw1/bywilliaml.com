'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { TiltCard } from '@/components/ui/tilt-card'

/** Adds `reveal-in` once the element scrolls into view (styles in globals.css). */
export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${shown ? 'reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function CountUp({ to, prefix = '', suffix = '', duration = 1400 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setValue(to)
        return
      }
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))))
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, duration])
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}

/** Three numbers from the bio, counting up as they arrive. */
export function StatStrip() {
  const stats = [
    { node: <CountUp to={13} />, label: 'age i ran the largest Skyblock server' },
    { node: <CountUp to={100} suffix="k+" />, label: 'members in my Clubhouse club' },
    { node: <CountUp to={100} prefix="$" suffix="k" />, label: 'in the first 16 days of my first business' },
  ]
  return (
    <div className="grid w-full grid-cols-3 divide-x divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
      {stats.map((s, i) => (
        <Reveal key={i} delay={i * 90} className="px-3 py-5 text-center sm:px-5">
          <div
            className="text-2xl font-bold tracking-tight sm:text-4xl"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {s.node}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-white/45 sm:text-xs">{s.label}</p>
        </Reveal>
      ))}
    </div>
  )
}

const TIMELINE: { when: string; title: string; body: string; image?: string; alt?: string }[] = [
  { when: '2000', title: 'Born', body: 'still figuring out my life — but it has been a pretty wild ride.' },
  { when: '13', title: 'Largest Skyblock server', body: 'ran the biggest Skyblock server there was, at thirteen.' },
  {
    when: 'School',
    title: 'Expelled, then out early',
    body: 'got expelled from middle school, then left high school and graduated a year early.',
  },
  {
    when: '19',
    title: '$100,000 in 16 days',
    body: 'launched my first real business and passed six figures in its first sixteen days.',
  },
  {
    when: 'Glendale',
    title: 'Young Entrepreneur',
    body: 'named Glendale Young Entrepreneur for Abrupt Collective.',
    image: '/polaroids/2.jpg',
    alt: 'Accepting the Glendale Young Entrepreneur award for Abrupt Collective',
  },
  {
    when: 'Clubhouse',
    title: '100,000+ member club',
    body: "ran a business networking club that interviewed leaders at companies like Dave's Hot Chicken.",
  },
  {
    when: 'Now',
    title: 'Building',
    body: 'helping friends launch multi-six and multi-seven figure businesses, and shipping my own projects.',
    image: '/polaroids/5.jpg',
    alt: 'Mirror selfie in the office',
  },
]

/** The bio as a vertical timeline, with real photos where there are any. */
export function Timeline() {
  return (
    <ol className="relative w-full">
      <div aria-hidden className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-violet-500/60 via-white/10 to-transparent sm:left-1/2" />
      {TIMELINE.map((item, i) => {
        const right = i % 2 === 1
        return (
          <li key={item.title} className="relative mb-8 pl-11 last:mb-0 sm:mb-10 sm:grid sm:grid-cols-2 sm:gap-10 sm:pl-0">
            <span
              aria-hidden
              className="absolute left-[9px] top-1.5 size-[13px] rounded-full border-2 border-black bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.7)] sm:left-1/2 sm:-translate-x-1/2"
            />
            <Reveal delay={60} className={right ? 'sm:col-start-2' : 'sm:text-right'}>
              <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/80">{item.when}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/55">{item.body}</p>
              {item.image && (
                <div
                  className={`group mt-4 inline-block overflow-hidden rounded-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${
                    right ? 'rotate-[1.5deg]' : '-rotate-[1.5deg]'
                  } transition-transform duration-500 hover:rotate-0 hover:scale-[1.03]`}
                >
                  <Image
                    src={item.image}
                    alt={item.alt ?? ''}
                    width={300}
                    height={300}
                    sizes="(min-width: 640px) 300px, 70vw"
                    className="aspect-[4/3] w-[min(300px,70vw)] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}
            </Reveal>
          </li>
        )
      })}
    </ol>
  )
}

/** Doorway into /setup, previewing the 3-D room with a still from it. */
export function SetupCard() {
  return (
    <Link
      href="/setup"
      className="group block w-full rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
    >
      <TiltCard tiltLimit={6} className="rounded-[28px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#060608]">
          <Image
            src="/setup/room-preview.jpg"
            alt="A 3-D render of William's desk: two monitors, MacBook, Stream Deck, Yeti mic and Leap chair"
            width={1200}
            height={982}
            sizes="(min-width: 768px) 672px, 100vw"
            className="aspect-[16/10] w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/80">explore in 3D</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">My Setup</h3>
              <p className="mt-1 text-sm text-white/55">the desk, the gear, and what i&apos;d tell you to buy.</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-black transition-transform duration-500 group-hover:-rotate-45 group-hover:scale-110">
              <ArrowUpRight className="size-5" aria-hidden />
            </span>
          </div>
        </div>
      </TiltCard>
    </Link>
  )
}
