'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import PolaroidStack, { type PolaroidItem } from '@/components/ui/polaroid-stack'

const polaroids: PolaroidItem[] = [
  {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop',
    caption: 'somewhere up high',
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
    <div className="min-h-screen h-full flex flex-col items-center font-light relative overflow-hidden w-full bg-black">
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
        className={`flex flex-col items-center justify-center flex-1 max-w-2xl px-8 py-20 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <PolaroidStack items={polaroids} />

        <p className="text-white/40 text-xs tracking-widest uppercase mt-2 mb-10">
          drag to flip through
        </p>

        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">About Me</h1>

        <div className="space-y-6 text-white/80 text-lg leading-relaxed text-center">
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

        <div className="w-full max-w-md space-y-3">
          {[
            { label: 'Numerology', value: '33', color: 'from-purple-500 to-violet-600' },
            { label: 'Myers-Briggs', value: 'INTJ-A', sub: 'Assertive Architect', color: 'from-blue-500 to-cyan-600' },
            { label: 'Principles You', value: 'The Shaper', color: 'from-amber-500 to-orange-600' },
            { label: 'Political Compass', value: '+0.63 / -1.74', sub: 'Right-Libertarian', color: 'from-emerald-500 to-green-600' },
            { label: 'Hogwarts House', value: 'Slytherin', sub: 'though I know nothing about Harry Potter', color: 'from-green-600 to-emerald-800' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4"
            >
              <div
                className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
              >
                <span className="text-white font-bold text-xs text-center leading-tight px-1">
                  {item.value.length <= 5 ? item.value : item.value.split(' ')[0]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-xs uppercase tracking-widest">{item.label}</p>
                <p className="text-white font-medium text-sm">{item.value}</p>
                {item.sub && (
                  <p className="text-white/50 text-xs mt-0.5">{item.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="w-16 h-px bg-white/20 my-10" />

        <p className="text-white/40 text-sm tracking-widest uppercase">More coming soon</p>
      </div>
    </div>
  )
}
