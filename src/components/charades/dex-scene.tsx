'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, RoundedBox, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { DECKS, INK, palette, textOn } from './data'

/**
 * The hero: Dex in 3D, with a ring of real cards from the bundled decks
 * orbiting behind. Built from primitives rather than a model file so it
 * loads with the page, keeps the sticker look (white border, ink outline,
 * flat toon shading) and needs no network beyond the bundle.
 */

const GLYPHS = ['?', '🔥', '🎉', '😂', '✓', '🎭', '⭐']

function toonGradient(): THREE.DataTexture {
  const texture = new THREE.DataTexture(new Uint8Array([165, 220, 255]), 3, 1, THREE.RedFormat)
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  draw(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Shrinks text until it fits, wrapping onto two lines when it helps. */
function fitText(ctx: CanvasRenderingContext2D, text: string, family: string, maxWidth: number, start: number) {
  const words = text.split(' ')
  for (let size = start; size > 20; size -= 4) {
    ctx.font = `800 ${size}px ${family}`
    if (ctx.measureText(text).width <= maxWidth) return { size, lines: [text] }
    if (words.length > 1) {
      let best: string[] | null = null
      for (let i = 1; i < words.length; i++) {
        const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
        if (lines.every((l) => ctx.measureText(l).width <= maxWidth)) best = lines
      }
      if (best) return { size, lines: best }
    }
  }
  return { size: 20, lines: [text] }
}

function glyphTexture(glyph: string, family: string) {
  return canvasTexture(256, 320, (ctx) => {
    ctx.fillStyle = INK
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const emoji = /\p{Extended_Pictographic}/u.test(glyph)
    ctx.font = emoji ? '150px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif' : `800 230px ${family}`
    ctx.fillText(glyph, 128, emoji ? 168 : 178)
  })
}

function cardFaceTexture(word: string, emoji: string, deckName: string, bg: string, family: string, bodyFamily: string) {
  return canvasTexture(512, 704, (ctx) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 512, 704)
    // A soft sheen, like the app's cards under a party light.
    const sheen = ctx.createLinearGradient(0, 0, 512, 704)
    sheen.addColorStop(0, 'rgba(255,255,255,0.22)')
    sheen.addColorStop(0.5, 'rgba(255,255,255,0)')
    ctx.fillStyle = sheen
    ctx.fillRect(0, 0, 512, 704)

    const fg = textOn(bg)
    ctx.fillStyle = fg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const { size, lines } = fitText(ctx, word, family, 440, 104)
    ctx.font = `800 ${size}px ${family}`
    const lh = size * 1.02
    lines.forEach((line, i) => ctx.fillText(line, 256, 352 + (i - (lines.length - 1) / 2) * lh))

    ctx.globalAlpha = 0.75
    ctx.font = `700 30px ${bodyFamily}`
    ctx.fillText(`${emoji}  ${deckName.toUpperCase()}`, 256, 640)
    ctx.globalAlpha = 1
  })
}

function cardBackTexture(family: string) {
  return canvasTexture(512, 704, (ctx) => {
    ctx.fillStyle = '#16161B'
    ctx.fillRect(0, 0, 512, 704)
    ctx.strokeStyle = 'rgba(255,229,0,0.16)'
    ctx.lineWidth = 3
    for (let i = -704; i < 512; i += 44) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 704, 704)
      ctx.stroke()
    }
    ctx.fillStyle = palette.yellow
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 300px ${family}`
    ctx.fillText('?', 256, 372)
  })
}

/** Points a feature mesh along the head's surface normal. */
function onSurface(dir: [number, number, number], depth = 1): { position: THREE.Vector3; quaternion: THREE.Quaternion } {
  const d = new THREE.Vector3(...dir).normalize()
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d)
  return { position: d.multiplyScalar(depth), quaternion: q }
}

function Feature({ dir, scale, color, opacity = 1, depth = 1 }: { dir: [number, number, number]; scale: [number, number, number]; color: string; opacity?: number; depth?: number }) {
  const { position, quaternion } = useMemo(() => onSurface(dir, depth), [dir, depth])
  return (
    <mesh position={position} quaternion={quaternion} scale={scale}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

function Dex({ family, onPoke }: { family: string; onPoke: () => void }) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const card = useRef<THREE.Group>(null)
  const boing = useRef(0)
  const spin = useRef(0)
  const [glyphIndex, setGlyphIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const gradient = useMemo(() => toonGradient(), [])
  const glyphs = useMemo(() => GLYPHS.map((g) => glyphTexture(g, family)), [family])
  const blink = useRef({ next: 2, t: -1 })

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const { x, y } = state.pointer
    if (root.current) {
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, x * 0.55, 0.08)
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -y * 0.28, 0.08)
    }

    // A squashy bounce: squash on the ground, stretch in the air.
    const phase = (Math.sin(t * 3.4) + 1) / 2
    boing.current = Math.max(0, boing.current - delta * 1.8)
    const b = Math.sin(boing.current * Math.PI * 3) * boing.current
    if (body.current) {
      body.current.position.y = phase * 0.16 + b * 0.25
      const squash = 0.045 * (1 - phase)
      body.current.scale.set(1 + squash + b * 0.12, 1 - squash + b * 0.12, 1 + squash + b * 0.12)
      body.current.rotation.z = -b * 0.25
    }

    // Blinks at an uneven, human rhythm.
    const bl = blink.current
    if (bl.t < 0 && t > bl.next) bl.t = 0
    if (eyes.current) {
      let s = 1
      if (bl.t >= 0) {
        bl.t += delta
        s = Math.max(0.08, Math.abs(1 - bl.t / 0.07))
        if (bl.t > 0.14) {
          bl.t = -1
          bl.next = t + 2 + Math.random() * 2.8
          s = 1
        }
      }
      eyes.current.scale.y = s
      eyes.current.position.x = THREE.MathUtils.lerp(eyes.current.position.x, x * 0.06, 0.1)
      eyes.current.position.y = THREE.MathUtils.lerp(eyes.current.position.y, y * 0.04, 0.1)
    }

    // Every few seconds the card wobbles like it is about to fall off.
    if (card.current) {
      const w = t % 4.6
      const wobble = w < 0.6 ? Math.sin(w * 22) * (0.6 - w) * 0.35 : 0
      card.current.rotation.z = -0.16 + wobble
      spin.current = Math.max(0, spin.current - delta * 1.6)
      // A poke spins the card a full turn, fast then settling.
      card.current.rotation.y = spin.current > 0 ? easeOut(1 - spin.current) * Math.PI * 2 : 0
    }
  })

  const poke = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    boing.current = 1
    spin.current = 1
    setGlyphIndex((i) => (i + 1) % GLYPHS.length)
    onPoke()
  }

  return (
    <group ref={root} position={[0, -0.15, 0]}>
      <group ref={body}>
        <group
          onClick={poke}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
          }}
          onPointerOut={() => setHovered(false)}
        >
          {/* Head: toon purple, an ink outline and the white sticker border. */}
          <group scale={[1, 0.93, 0.95]}>
            <mesh>
              <sphereGeometry args={[1, 64, 48]} />
              <meshToonMaterial color={palette.purple} gradientMap={gradient} />
            </mesh>
            <mesh scale={1.055}>
              <sphereGeometry args={[1, 48, 32]} />
              <meshBasicMaterial color={INK} side={THREE.BackSide} />
            </mesh>
            <mesh scale={1.16}>
              <sphereGeometry args={[1, 48, 32]} />
              <meshBasicMaterial color="#FFFFFF" side={THREE.BackSide} />
            </mesh>

            <Feature dir={[-0.5, 0.42, 0.75]} scale={[0.09, 0.17, 0.03]} color="#FFFFFF" opacity={0.35} />
            <Feature dir={[-0.62, -0.42, 0.66]} scale={[0.17, 0.1, 0.03]} color="#FF7FB0" opacity={0.9} />
            <Feature dir={[0.62, -0.42, 0.66]} scale={[0.17, 0.1, 0.03]} color="#FF7FB0" opacity={0.9} />

            <group ref={eyes}>
              <Feature dir={[-0.33, -0.05, 0.94]} scale={[0.115, 0.16, 0.05]} color={INK} />
              <Feature dir={[0.33, -0.05, 0.94]} scale={[0.115, 0.16, 0.05]} color={INK} />
              <Feature dir={[-0.29, 0.03, 0.96]} scale={[0.035, 0.035, 0.03]} color="#FFFFFF" depth={1.03} />
              <Feature dir={[0.37, 0.03, 0.93]} scale={[0.035, 0.035, 0.03]} color="#FFFFFF" depth={1.03} />
            </group>

            {/* The smile: half a torus, pressed onto the face. */}
            <mesh position={[0, -0.36, 0.93]} rotation={[0.38, 0, Math.PI]}>
              <torusGeometry args={[0.17, 0.035, 12, 32, Math.PI]} />
              <meshBasicMaterial color={INK} />
            </mesh>
          </group>

          {/* The card, stuck to the forehead, pivoting from its bottom edge. */}
          <group ref={card} position={[0.08, 0.68, 0.18]} rotation={[-0.2, 0, -0.16]}>
            <group position={[0, 0.5, 0]}>
              <RoundedBox args={[0.8, 1.0, 0.07]} radius={0.12} smoothness={4}>
                <meshToonMaterial color={palette.yellow} gradientMap={gradient} />
              </RoundedBox>
              <RoundedBox args={[0.8, 1.0, 0.07]} radius={0.12} smoothness={4} scale={[1.09, 1.07, 1.6]}>
                <meshBasicMaterial color={INK} side={THREE.BackSide} />
              </RoundedBox>
              <RoundedBox args={[0.8, 1.0, 0.07]} radius={0.12} smoothness={4} scale={[1.24, 1.19, 2.4]}>
                <meshBasicMaterial color="#FFFFFF" side={THREE.BackSide} />
              </RoundedBox>
              <mesh position={[0, 0, 0.037]}>
                <planeGeometry args={[0.62, 0.78]} />
                <meshBasicMaterial map={glyphs[glyphIndex]} transparent />
              </mesh>
              <mesh position={[0, 0, -0.037]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.62, 0.78]} />
                <meshBasicMaterial map={glyphs[(glyphIndex + 1) % GLYPHS.length]} transparent />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

/** Cards from real decks, floating around Dex. Never in front of him. */
const FLOATERS: { pos: [number, number, number]; spin: number }[] = [
  { pos: [-3.3, 1.15, -1.2], spin: 0.35 },
  { pos: [3.4, 1.0, -1.6], spin: -0.3 },
  { pos: [-4.6, -0.6, -2.6], spin: 0.22 },
  { pos: [4.5, -0.9, -2.2], spin: -0.4 },
  { pos: [-2.5, -1.25, -0.4], spin: -0.28 },
  { pos: [2.6, -1.35, -0.2], spin: 0.3 },
  { pos: [-1.6, 1.9, -3.4], spin: 0.25 },
  { pos: [1.9, 2.0, -3.8], spin: -0.2 },
]

const CARDS = FLOATERS.map((f, i) => {
  const deck = DECKS[(i * 5 + 1) % DECKS.length]
  return { ...f, deck, word: deck.cards[i % 4] }
})

function FloatingCards({ family, bodyFamily, scrollRef }: { family: string; bodyFamily: string; scrollRef: RefObject<number> }) {
  const group = useRef<THREE.Group>(null)
  const cards = useRef<(THREE.Group | null)[]>([])
  const back = useMemo(() => cardBackTexture(family), [family])
  const fronts = useMemo(
    () => CARDS.map(({ word, deck }) => cardFaceTexture(word, deck.emoji, deck.name, deck.color, family, bodyFamily)),
    [family, bodyFamily],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Narrow screens pull the cards in and push them behind Dex.
    const spread = THREE.MathUtils.clamp(state.viewport.aspect / 2.3, 0.42, 1)
    const scroll = (scrollRef.current ?? 0) / Math.max(1, state.size.height)
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.12, 0.05)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.06, 0.05)
    }
    cards.current.forEach((c, i) => {
      if (!c) return
      const { pos, spin } = CARDS[i]
      // Scrolling sends the cards flying outwards and up.
      const fly = 1 + scroll * 0.9
      c.position.set(pos[0] * spread * fly, pos[1] + Math.sin(t * 0.9 + i * 1.7) * 0.16 + scroll * 1.6, pos[2] - (1 - spread) * 2.6)
      c.rotation.y = Math.sin(t * spin + i) * 0.9 + (pos[0] < 0 ? 0.35 : -0.35)
      c.rotation.z = Math.sin(t * 0.6 + i) * 0.14 + (pos[0] < 0 ? 0.12 : -0.12)
    })
  })

  return (
    <group ref={group}>
      {CARDS.map(({ deck, word }, i) => (
        <group key={word} ref={(el) => void (cards.current[i] = el)}>
          <RoundedBox args={[0.92, 1.26, 0.04]} radius={0.08} smoothness={3}>
            <meshBasicMaterial color={deck.color} />
          </RoundedBox>
          <mesh position={[0, 0, 0.022]}>
            <planeGeometry args={[0.86, 1.2]} />
            <meshBasicMaterial map={fronts[i]} />
          </mesh>
          <mesh position={[0, 0, -0.022]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.86, 1.2]} />
            <meshBasicMaterial map={back} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Shrinks Dex on narrow screens so the card on his head stays in frame. */
function Responsive({ children }: { children: ReactNode }) {
  const aspect = useThree((state) => state.viewport.aspect)
  const scale = THREE.MathUtils.clamp(aspect / 1.15, 0.72, 1)
  return <group scale={scale}>{children}</group>
}

export default function DexScene({
  eventSource,
  family,
  bodyFamily,
  active,
  onPoke,
}: {
  eventSource: RefObject<HTMLElement | null>
  family: string
  bodyFamily: string
  active: boolean
  onPoke: () => void
}) {
  const scroll = useRef(0)
  useEffect(() => {
    const onScroll = () => (scroll.current = window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Canvas
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 2]}
      camera={{ position: [0, 0.35, 6.4], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[-3, 5, 4]} intensity={2.2} />
      <pointLight position={[3, -1, -3]} intensity={8} color={palette.pink} />
      <FloatingCards family={family} bodyFamily={bodyFamily} scrollRef={scroll} />
      <Responsive>
        <Dex family={family} onPoke={onPoke} />
      </Responsive>
      <Sparkles count={70} scale={[9, 5, 4]} size={3.2} speed={0.35} color={palette.yellow} opacity={0.7} />
      <Sparkles count={40} scale={[9, 5, 4]} size={2.4} speed={0.25} color={palette.pink} opacity={0.6} />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.55} scale={6} blur={2.6} far={3} color="#000000" />
    </Canvas>
  )
}
