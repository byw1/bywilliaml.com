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
          href="/links"
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
          <p>Hey, I&apos;m William. Welcome to my corner of the internet.</p>
          <p>
            I&apos;m a developer and creator passionate about building things that live at the
            intersection of technology and design.
          </p>
          <p>
            When I&apos;m not coding, you can find me writing on{' '}
            <a
              href="https://bywilliaml.substack.com/archive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-4 hover:text-white/60 transition-colors"
            >
              Substack
            </a>
            , exploring new ideas, and working on projects that push boundaries.
          </p>
        </div>

        <div className="w-16 h-px bg-white/20 my-10" />

        <p className="text-white/40 text-sm tracking-widest uppercase">More coming soon</p>
      </div>
    </div>
  )
}
