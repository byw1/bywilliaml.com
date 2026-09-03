'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const games = [
  {
    name: 'Minecraft',
    description: 'The game behind the Skyblock server days',
    category: 'Sandbox',
    color: 'linear-gradient(135deg, #1a2e1a, #2d4a1a)',
  },
  {
    name: 'Balatro',
    description: 'Poker hands warped into a roguelike deckbuilder',
    category: 'Roguelike',
    color: 'linear-gradient(135deg, #2d1a1a, #3e1a2a)',
  },
  {
    name: 'Satisfactory',
    description: 'First-person factory building on an alien planet',
    category: 'Factory sim',
    color: 'linear-gradient(135deg, #2d2a1a, #1a2e1a)',
  },
]

export default function VideogamesPage() {
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
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Videogames</h1>
        <p className="text-white/50 text-sm mb-10">what i play when i&apos;m not building</p>

        <div className="w-full space-y-3">
          {games.map((game) => (
            <div
              key={game.name}
              className="flex items-center gap-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 sm:p-5 transition-colors hover:bg-white/[0.06]"
            >
              <div
                aria-hidden="true"
                className="h-12 w-12 shrink-0 rounded-xl border border-white/10 flex items-center justify-center text-white font-semibold"
                style={{ background: game.color }}
              >
                {game.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <h3 className="text-white font-medium truncate">{game.name}</h3>
                  <span className="text-white/40 text-xs uppercase tracking-widest shrink-0">{game.category}</span>
                </div>
                <p className="text-white/50 text-sm">{game.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
