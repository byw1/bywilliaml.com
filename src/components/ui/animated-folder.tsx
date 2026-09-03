'use client'

import { useState } from 'react'

interface FolderItem {
  id: string
  title: string
  color: string
}

interface AnimatedFolderProps {
  title: string
  items: FolderItem[]
  folderColor?: string
  href?: string
  className?: string
}

const EASE_SMOOTH = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_SPRING = 'cubic-bezier(0.34, 1.4, 0.64, 1)'

/**
 * A manila folder built as one preserve-3d object: back panel with an
 * attached tab, three documents stacked at real depths between the panels,
 * and a shorter front panel hinged at its bottom edge. At rest the papers
 * peek over the front lip; on hover/focus the folder tips toward the viewer,
 * the front swings open on its hinge, and the papers rise and fan out.
 */
export function AnimatedFolder({
  title,
  items,
  folderColor = '#f59e0b',
  href,
  className = '',
}: AnimatedFolderProps) {
  const [open, setOpen] = useState(false)

  const dark = `color-mix(in srgb, ${folderColor} 55%, #000)`
  const mid = `color-mix(in srgb, ${folderColor} 78%, #000)`
  const lit = `color-mix(in srgb, ${folderColor} 88%, #fff 4%)`

  const fan = [
    { x: -46, r: -11, d: 0 },
    { x: 0, r: 0, d: 60 },
    { x: 46, r: 11, d: 120 },
  ]

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl ${href ? 'cursor-pointer' : 'cursor-default'} bg-white/[0.03] border border-white/[0.06] transition-colors duration-500 hover:border-white/10 group ${className}`}
      style={{ minWidth: '160px', minHeight: '220px' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {/* Colored wash behind the folder */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 72%, ${folderColor} 0%, transparent 68%)`,
          opacity: open ? 0.09 : 0.03,
        }}
      />

      <div
        className="relative flex items-end justify-center"
        style={{ height: '128px', width: '148px', perspective: '900px' }}
      >
        {/* Ground shadow — spreads as the folder tips forward */}
        <div
          aria-hidden="true"
          className="absolute left-[16%] right-[16%] bottom-[10px] h-3 rounded-[50%] blur-md transition-all duration-500"
          style={{
            background: 'rgba(0,0,0,0.55)',
            transform: open ? 'scaleX(1.15)' : 'scaleX(1)',
            opacity: open ? 0.8 : 0.55,
            transitionTimingFunction: EASE_SMOOTH,
          }}
        />

        {/* The folder itself — one 3-D object */}
        <div
          className="relative"
          style={{
            width: '100px',
            height: '78px',
            marginBottom: '14px',
            transformStyle: 'preserve-3d',
            transform: open
              ? 'rotateX(-10deg) translateY(-3px)'
              : 'rotateX(6deg)',
            transition: `transform 550ms ${EASE_SMOOTH}`,
          }}
        >
          {/* Back panel, tab attached so it can never float */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: `linear-gradient(180deg, ${mid} 0%, ${dark} 100%)`,
              transform: 'translateZ(0px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <div
              className="absolute rounded-t-md"
              style={{
                top: '-9px',
                left: '10px',
                width: '38px',
                height: '10px',
                background: `linear-gradient(180deg, ${mid}, ${mid})`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
            />
            {/* Interior cavity shading, visible when the front swings open */}
            <div
              className="absolute inset-x-0 bottom-0 h-3/4 rounded-b-lg transition-opacity duration-500"
              style={{
                background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.72))',
                opacity: open ? 1 : 0.55,
              }}
            />
          </div>

          {/* Documents — real depths between back and front */}
          {items.slice(0, 3).map((item, i) => (
            <div
              key={item.id}
              className="absolute rounded-md overflow-hidden border border-white/10"
              style={{
                width: '58px',
                height: '76px',
                left: '21px',
                bottom: '4px',
                background: item.color,
                transformOrigin: 'bottom center',
                transform: open
                  ? `translateZ(${6 + i * 5}px) translateY(-66px) translateX(${fan[i].x}px) rotate(${fan[i].r}deg)`
                  : `translateZ(${3 + i * 2}px) translateY(${-6 - i * 3}px) scale(0.96)`,
                transition: `transform 600ms ${EASE_SPRING} ${open ? fan[i].d : (2 - i) * 40}ms`,
                boxShadow: open
                  ? '0 14px 28px rgba(0,0,0,0.55)'
                  : '0 2px 6px rgba(0,0,0,0.4)',
                zIndex: 5 + i,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'rgba(255,255,255,0.25)' }}
              />
              <p
                className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] font-medium text-white truncate transition-opacity duration-300"
                style={{ opacity: open ? 1 : 0 }}
              >
                {item.title}
              </p>
            </div>
          ))}

          {/* Front panel — shorter than the back, hinged at its bottom */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-lg"
            style={{
              height: '60px',
              background: `linear-gradient(180deg, ${lit} 0%, ${mid} 100%)`,
              transform: open
                ? 'translateZ(18px) rotateX(17deg) scaleY(0.96)'
                : 'translateZ(14px) rotateX(0deg)',
              transformOrigin: 'bottom center',
              transition: `transform 550ms ${EASE_SMOOTH}`,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 16px rgba(0,0,0,0.35)',
              zIndex: 30,
            }}
          >
            {/* Lip shadow along the opening */}
            <div
              className="absolute inset-x-0 top-0 h-1.5 rounded-t-lg"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.28), transparent)' }}
            />
            {/* Soft diagonal light on the face */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background:
                  'linear-gradient(128deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 42%, transparent 60%)',
              }}
            />
          </div>
        </div>
      </div>

      <h3
        className="text-sm font-semibold text-white mt-2 transition-transform duration-300"
        style={{ transform: open ? 'translateY(2px)' : 'translateY(0)' }}
      >
        {title}
      </h3>

      {href && (
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          aria-label={
            href.startsWith('http') ? `${title} — opens in a new tab` : title
          }
          className="absolute inset-0 z-40 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
