'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Icons are official app/store art, saved locally under public/games/
// (iTunes lookups for the mobile titles, Steam art for Satisfactory).
interface Game {
  name: string
  description: string
  category: string
  icon: string
  modes?: string[]
}

const CURRENT: Game[] = [
  {
    name: 'Minecraft',
    description: 'The game behind the server days',
    category: 'Sandbox',
    icon: '/games/minecraft.jpg',
    modes: ['Skyblock', 'Factions', 'Towny'],
  },
  {
    name: 'Balatro',
    description: 'Poker hands warped into a roguelike deckbuilder',
    category: 'Roguelike',
    icon: '/games/balatro.jpg',
  },
  {
    name: 'Satisfactory',
    description: 'First-person factory building on an alien planet',
    category: 'Factory sim',
    icon: '/games/satisfactory.jpg',
  },
  {
    name: 'The Battle of Polytopia',
    description: 'Bite-size turn-based strategy on a tiny low-poly world',
    category: 'Strategy',
    icon: '/games/polytopia.jpg',
  },
]

const RETIRED: Game[] = [
  {
    name: 'Clash Royale',
    description:
      'Founded Abrupt — the #1 clan in the US for about six months of high school',
    category: 'Card battler',
    icon: '/games/clash-royale.jpg',
  },
]

function GameCard({ game, muted = false }: { game: Game; muted?: boolean }) {
  return (
    <div
      className={`flex items-start gap-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 sm:p-5 transition-colors hover:bg-white/[0.06] ${
        muted ? 'opacity-80' : ''
      }`}
    >
      <Image
        src={game.icon}
        alt=""
        width={56}
        height={56}
        className={`rounded-xl shrink-0 border border-white/10 ${muted ? 'grayscale-[0.35]' : ''}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 mb-0.5">
          <h3 className="text-white font-medium truncate">{game.name}</h3>
          <span className="text-white/40 text-xs uppercase tracking-widest shrink-0 hidden sm:block">
            {game.category}
          </span>
        </div>
        <p className="text-white/50 text-sm">{game.description}</p>
        {game.modes && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {game.modes.map((mode) => (
              <span
                key={mode}
                className="text-[10px] uppercase tracking-wider text-white/50 bg-white/[0.06] border border-white/[0.06] rounded-full px-2.5 py-1"
              >
                {mode}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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
          {CURRENT.map((game) => (
            <GameCard key={game.name} game={game} />
          ))}
        </div>

        <div className="w-16 h-px bg-white/20 my-10" />

        <h2 className="text-xl font-bold text-white mb-1 tracking-tight">The Retired Shelf</h2>
        <p className="text-white/50 text-sm mb-6">games i don&apos;t play anymore, still worth noting</p>

        <div className="w-full space-y-3">
          {RETIRED.map((game) => (
            <GameCard key={game.name} game={game} muted />
          ))}
        </div>
      </div>
    </div>
  )
}
