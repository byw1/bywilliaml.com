'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const channels = [
  { name: 'All-In Podcast', description: 'Tech, politics, and business with Chamath, Jason, Sacks & Friedberg', category: 'Business' },
  { name: 'Harvard Business School', description: 'Case studies and leadership insights', category: 'Education' },
  { name: 'Kurzgesagt', description: 'Science and philosophy beautifully animated', category: 'Science' },
]

export default function YoutubeChannelsPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center font-light relative overflow-hidden w-full bg-black">
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/about"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} />
          <span className="text-sm tracking-wide">About</span>
        </Link>
      </div>

      <div
        className={`flex flex-col items-center max-w-2xl w-full px-8 py-20 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">YouTube Channels</h1>
        <p className="text-white/50 text-sm mb-10">channels i watch and recommend</p>

        <div className="w-full space-y-3">
          {channels.map((ch) => (
            <div
              key={ch.name}
              className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-medium">{ch.name}</h3>
                <span className="text-white/30 text-xs uppercase tracking-widest">{ch.category}</span>
              </div>
              <p className="text-white/50 text-sm">{ch.description}</p>
            </div>
          ))}
        </div>

        <div className="w-16 h-px bg-white/20 my-10" />
        <p className="text-white/40 text-sm tracking-widest uppercase">more coming soon</p>
      </div>
    </div>
  )
}
