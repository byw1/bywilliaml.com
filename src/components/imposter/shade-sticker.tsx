import type { CSSProperties } from 'react'
import { eyeParts, headParts, mouthParts, SHADE, type MascotMood, type Part } from './shade-face'

function draw(part: Part, i: number) {
  switch (part.tag) {
    case 'ellipse':
      return <ellipse key={i} cx={part.cx} cy={part.cy} rx={part.rx} ry={part.ry} fill={part.fill} stroke={part.stroke} strokeWidth={part.strokeWidth} opacity={part.opacity} />
    case 'circle':
      return <circle key={i} cx={part.cx} cy={part.cy} r={part.r} fill={part.fill} stroke={part.stroke} strokeWidth={part.strokeWidth} />
    case 'path':
      return <path key={i} d={part.d} fill={part.fill} stroke={part.stroke} strokeWidth={part.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  }
}

/**
 * Shade as a flat sticker, drawn from the app's own face data
 * (byw1/imposter: src/ui/shadeFace.ts, copied here as shade-face.ts). A red
 * Dex with heavy, half-shut lids and a lime question mark on its forehead:
 * everyone else knows the word, Shade doesn't.
 */
export function ShadeSticker({
  size = 120,
  mood = 'smirk',
  look = 0,
  blinking = false,
  glyph = '?',
  bounce = false,
  className,
  style,
}: {
  size?: number
  mood?: MascotMood
  /** -1, 0 or 1: where the eyes are looking. */
  look?: number
  blinking?: boolean
  glyph?: string
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
      viewBox="-6 -6 132 132"
      role="img"
      aria-label="Shade, the Imposter mascot"
      className={`${bounce ? 'shade-bob' : ''} ${className ?? ''}`}
      style={style}
    >
      <g fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={12} strokeLinejoin="round">
        <ellipse cx={60} cy={73} rx={42} ry={39} />
        <g transform="rotate(9 60 30)">
          <rect x={40} y={5} width={40} height={50} rx={9} />
        </g>
      </g>
      {headParts().map(draw)}
      <ellipse cx={34} cy={60} rx={5} ry={9} fill="#FFFFFF" opacity={0.28} transform="rotate(20 34 60)" />
      {eyeParts(mood, look, blinking).map(draw)}
      {mouthParts(mood).map(draw)}

      <g className={bounce ? 'shade-card' : undefined} style={{ transformOrigin: '64px 55px' }}>
        <g transform="rotate(9 60 30)">
          <rect x={40} y={5} width={40} height={50} rx={9} fill={SHADE.card} stroke={SHADE.ink} strokeWidth={4} />
          <text
            x={60}
            y={emoji ? 38 : 42}
            fontSize={emoji ? 22 : 32}
            fontWeight={800}
            fill={SHADE.ink}
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
