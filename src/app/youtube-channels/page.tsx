'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Handles verified against youtube.com (each resolves to the named channel);
// icons are local copies of the channel avatars in public/youtube/.
const channels = [
  { name: 'All-In Podcast', description: 'Tech, politics, and business with Chamath, Jason, Sacks & Friedberg', category: 'Business', href: 'https://www.youtube.com/@allin', icon: '/youtube/all-in.jpg' },
  { name: 'Harvard Business School', description: 'Case studies and leadership insights', category: 'Education', href: 'https://www.youtube.com/@HarvardHBS', icon: '/youtube/harvard-business-school.jpg' },
  { name: 'Kurzgesagt', description: 'Science and philosophy beautifully animated', category: 'Science', href: 'https://www.youtube.com/@kurzgesagt', icon: '/youtube/kurzgesagt.jpg' },
  { name: 'Search Party', description: 'Independent journalism', category: 'Journalism', href: 'https://www.youtube.com/@searchparty', icon: '/youtube/search-party.jpg' },
  { name: 'Chamath Palihapitiya', description: 'Venture capital, tech, and macro takes', category: 'Business', href: 'https://www.youtube.com/@chamath', icon: '/youtube/chamath.jpg' },
  { name: 'Chris Williamson', description: 'Long-form conversations on life and culture', category: 'Podcast', href: 'https://www.youtube.com/@ChrisWillx', icon: '/youtube/chris-williamson.jpg' },
  { name: 'hoe_math', description: 'Psychology and research through a math lens', category: 'Psychology', href: 'https://www.youtube.com/@hoe_math', icon: '/youtube/hoe-math.jpg' },
  { name: 'Johnny Harris', description: 'Storytelling-driven independent journalism', category: 'Journalism', href: 'https://www.youtube.com/@johnnyharris', icon: '/youtube/johnny-harris.jpg' },
  { name: 'Veritasium', description: 'Science, engineering, and the unexpected', category: 'Science', href: 'https://www.youtube.com/@veritasium', icon: '/youtube/veritasium.jpg' },
  { name: 'Lex Fridman', description: 'Deep conversations with scientists, leaders, and thinkers', category: 'Podcast', href: 'https://www.youtube.com/@lexfridman', icon: '/youtube/lex-fridman.jpg' },
  { name: 'SpoonFedStudy', description: 'Mindset, discipline, and self-improvement', category: 'Mindset', href: 'https://www.youtube.com/@SpoonFedStudy', icon: '/youtube/spoonfedstudy.jpg' },
]

export default function YoutubeChannelsPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center font-light relative overflow-x-hidden w-full bg-black">
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/about"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          <span className="text-sm tracking-wide">About</span>
        </Link>
      </div>

      <div
        className={`flex flex-col items-center max-w-2xl w-full px-5 sm:px-8 py-20 transition-all duration-1000 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">YouTube Channels</h1>
        <p className="text-white/50 text-sm mb-10">channels i watch and recommend</p>

        <div className="w-full space-y-3">
          {channels.map((ch) => (
            <a
              key={ch.name}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 sm:p-5 transition-colors hover:bg-white/[0.07] hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <Image
                src={ch.icon}
                alt=""
                width={48}
                height={48}
                className="rounded-full shrink-0 border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <h3 className="text-white font-medium flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{ch.name}</span>
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-white/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                      aria-hidden="true"
                    />
                  </h3>
                  <span className="text-white/40 text-xs uppercase tracking-widest shrink-0 hidden sm:block">{ch.category}</span>
                </div>
                <p className="text-white/50 text-sm truncate sm:whitespace-normal">{ch.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
