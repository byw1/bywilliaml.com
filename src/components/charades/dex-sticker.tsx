import type { CSSProperties } from 'react'
import { INK, palette } from './data'

export type DexMood = 'happy' | 'excited' | 'wow'

/**
 * Dex as a flat sticker, drawn from the same geometry as the app's mascot
 * (byw1/charades: src/ui/Mascot.tsx). Used where the 3D Dex would be too
 * much: the nav, fallbacks, reduced motion, small inline moments.
 */
export function DexSticker({
  size = 120,
  mood = 'happy',
  glyph = '?',
  tint = palette.purple,
  bounce = false,
  className,
  style,
}: {
  size?: number
  mood?: DexMood
  glyph?: string
  tint?: string
  /** A gentle idle bob and card wobble, in CSS so it costs nothing. */
  bounce?: boolean
  className?: string
  style?: CSSProperties
}) {
  const emoji = /\p{Extended_Pictographic}/u.test(glyph)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Dex, the Charades mascot"
      className={`${bounce ? 'dex-bob' : ''} ${className ?? ''}`}
      style={style}
    >
      <g fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={12} strokeLinejoin="round">
        <ellipse cx={60} cy={73} rx={42} ry={39} />
        <g transform="rotate(-9 60 30)">
          <rect x={40} y={5} width={40} height={50} rx={9} />
        </g>
      </g>
      <ellipse cx={60} cy={73} rx={42} ry={39} fill={tint} stroke={INK} strokeWidth={3.5} />
      <ellipse cx={60} cy={86} rx={30} ry={20} fill="#FFFFFF" opacity={0.08} />
      <ellipse cx={34} cy={60} rx={5} ry={9} fill="#FFFFFF" opacity={0.28} transform="rotate(20 34 60)" />
      <ellipse cx={30} cy={93} rx={8} ry={5} fill="#FF7FB0" opacity={0.85} />
      <ellipse cx={90} cy={93} rx={8} ry={5} fill="#FF7FB0" opacity={0.85} />

      {mood === 'excited' ? (
        <g fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M37 80 L45 74 L53 80" />
          <path d="M67 80 L75 74 L83 80" />
        </g>
      ) : (
        <g className={bounce ? 'dex-blink' : undefined} style={{ transformOrigin: '60px 80px' }}>
          <ellipse cx={44} cy={80} rx={mood === 'wow' ? 7 : 6} ry={mood === 'wow' ? 9 : 8} fill={INK} />
          <ellipse cx={76} cy={80} rx={mood === 'wow' ? 7 : 6} ry={mood === 'wow' ? 9 : 8} fill={INK} />
          <circle cx={46} cy={77} r={2} fill="#FFFFFF" />
          <circle cx={78} cy={77} r={2} fill="#FFFFFF" />
        </g>
      )}

      {mood === 'wow' ? (
        <ellipse cx={60} cy={98} rx={6} ry={7} fill={INK} />
      ) : mood === 'excited' ? (
        <path d="M46 92 Q60 108 74 92 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ) : (
        <path d="M50 95 Q60 103 70 95" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      )}

      <g className={bounce ? 'dex-card' : undefined} style={{ transformOrigin: '64px 55px' }}>
        <g transform="rotate(-9 60 30)">
          <rect x={40} y={5} width={40} height={50} rx={9} fill={palette.yellow} stroke={INK} strokeWidth={4} />
          <text
            x={60}
            y={emoji ? 38 : 41}
            fontSize={emoji ? 22 : 30}
            fontWeight={800}
            fill={INK}
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
          >
            {glyph}
          </text>
        </g>
      </g>
    </svg>
  )
}
