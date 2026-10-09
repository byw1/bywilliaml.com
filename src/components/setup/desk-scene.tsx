"use client"

import * as THREE from "three"
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"
import { GEAR, type GearId } from "@/app/setup/gear"

/*
 * William's desk, modelled from primitives so the page downloads no assets:
 * every object is boxes, cylinders and spheres, and the screens are painted
 * onto canvas textures at runtime. Units are roughly metres.
 */

const DESK_Y = 0.74

/** Where each item's hotspot floats and where the camera flies to inspect it. */
const FOCUS: Record<GearId, { hotspot: [number, number, number]; target: [number, number, number]; camera: [number, number, number] }> = {
  monitors: { hotspot: [0, 1.42, -1.72], target: [0, 1.1, -1.75], camera: [0.35, 1.3, -0.15] },
  macbook: { hotspot: [0.98, 1.08, -1.38], target: [0.95, 0.88, -1.4], camera: [1.45, 1.15, -0.65] },
  keyboard: { hotspot: [-0.05, 0.86, -1.23], target: [-0.05, 0.77, -1.25], camera: [0.0, 1.25, -0.55] },
  mouse: { hotspot: [0.34, 0.86, -1.2], target: [0.34, 0.78, -1.22], camera: [0.6, 1.15, -0.65] },
  streamdeck: { hotspot: [-0.48, 0.88, -1.27], target: [-0.48, 0.79, -1.3], camera: [-0.75, 1.15, -0.7] },
  mic: { hotspot: [-0.8, 1.08, -1.42], target: [-0.8, 0.9, -1.45], camera: [-1.25, 1.2, -0.75] },
  speakers: { hotspot: [0.88, 1.03, -1.78], target: [0.6, 0.6, -1.7], camera: [1.5, 1.05, -0.4] },
  airpods: { hotspot: [0.62, 0.84, -1.17], target: [0.65, 0.77, -1.2], camera: [0.95, 1.05, -0.75] },
  chair: { hotspot: [0.05, 1.32, -0.5], target: [0.05, 0.7, -0.6], camera: [1.6, 1.4, 1.1] },
}

const HOME = { target: new THREE.Vector3(0, 0.95, -1.35), camera: new THREE.Vector3(2.1, 1.75, 1.35) }

/* ---------- canvas textures for the screens and keys ---------- */

function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")!
  paint(ctx)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function codeScreen() {
  return canvasTexture(1024, 576, (g) => {
    g.fillStyle = "#0d1117"
    g.fillRect(0, 0, 1024, 576)
    g.fillStyle = "#161b22"
    g.fillRect(0, 0, 190, 576)
    g.fillRect(0, 0, 1024, 30)
    const cols = ["#ff7b72", "#d2a8ff", "#79c0ff", "#a5d6ff", "#7ee787", "#ffa657", "#8b949e"]
    let seed = 7
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 16; i++) {
      g.fillStyle = "#30363d"
      g.fillRect(22, 52 + i * 30, 60 + rand() * 90, 10)
    }
    for (let line = 0; line < 26; line++) {
      const y = 50 + line * 20
      g.fillStyle = "#484f58"
      g.fillRect(205, y, 18, 8)
      let x = 240 + (line % 6 === 0 ? 0 : 24 * Math.floor(rand() * 3))
      const tokens = 2 + Math.floor(rand() * 5)
      for (let t = 0; t < tokens; t++) {
        const w = 24 + rand() * 110
        g.fillStyle = cols[Math.floor(rand() * cols.length)]
        g.fillRect(x, y, w, 8)
        x += w + 10
      }
    }
  })
}

function browserScreen() {
  return canvasTexture(1024, 576, (g) => {
    g.fillStyle = "#050505"
    g.fillRect(0, 0, 1024, 576)
    g.fillStyle = "#1c1c1f"
    g.fillRect(0, 0, 1024, 40)
    ;["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
      g.fillStyle = c
      g.beginPath()
      g.arc(24 + i * 22, 20, 7, 0, Math.PI * 2)
      g.fill()
    })
    g.fillStyle = "#2c2c30"
    g.fillRect(320, 10, 384, 20)
    g.fillStyle = "#a1a1aa"
    g.font = "14px sans-serif"
    g.fillText("bywilliaml.com", 470, 25)
    // the homepage's book stack, in miniature
    const grad = (a: string, b: string, x: number, y: number) => {
      const gr = g.createLinearGradient(x, y, x + 150, y + 190)
      gr.addColorStop(0, a)
      gr.addColorStop(1, b)
      return gr
    }
    g.globalAlpha = 0.35
    g.fillStyle = grad("#0d1117", "#161b22", 437, 70)
    g.fillRect(452, 70, 120, 120)
    g.globalAlpha = 1
    g.fillStyle = grad("#24244a", "#16213e", 432, 170)
    g.fillRect(432, 170, 160, 200)
    g.fillStyle = "#ffffff"
    g.font = "bold 18px sans-serif"
    g.fillText("About Me", 450, 340)
    g.globalAlpha = 0.35
    g.fillStyle = grad("#3a0000", "#1a0000", 452, 390)
    g.fillRect(452, 390, 120, 110)
    g.globalAlpha = 1
    g.fillStyle = "#26262a"
    g.fillRect(392, 520, 240, 38)
  })
}

function laptopScreen() {
  return canvasTexture(640, 400, (g) => {
    const gr = g.createLinearGradient(0, 0, 640, 400)
    gr.addColorStop(0, "#1e1b4b")
    gr.addColorStop(0.5, "#6d28d9")
    gr.addColorStop(1, "#f472b6")
    g.fillStyle = gr
    g.fillRect(0, 0, 640, 400)
    g.fillStyle = "rgba(255,255,255,0.18)"
    g.fillRect(170, 360, 300, 30)
    g.fillStyle = "rgba(0,0,0,0.35)"
    g.fillRect(0, 0, 640, 18)
  })
}

function streamDeckKeys() {
  return canvasTexture(500, 300, (g) => {
    g.fillStyle = "#111"
    g.fillRect(0, 0, 500, 300)
    const cols = ["#8b5cf6", "#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#ec4899", "#14b8a6", "#e4e4e7"]
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++) {
        const x = 18 + c * 96
        const y = 18 + r * 94
        g.fillStyle = "#1f1f22"
        g.fillRect(x, y, 80, 80)
        g.fillStyle = cols[(r * 5 + c) % cols.length]
        g.beginPath()
        g.arc(x + 40, y + 40, 20, 0, Math.PI * 2)
        g.fill()
      }
  })
}

function keyboardKeys() {
  return canvasTexture(860, 260, (g) => {
    g.fillStyle = "#2a2a2d"
    g.fillRect(0, 0, 860, 260)
    const rows = [15, 14, 14, 13, 12]
    rows.forEach((count, r) => {
      const w = (600 - 6 * count) / count
      for (let k = 0; k < count; k++) {
        g.fillStyle = "#3b3b40"
        g.fillRect(12 + k * (w + 6), 14 + r * 46, w, 38)
      }
    })
    g.fillStyle = "#3b3b40"
    for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) g.fillRect(640 + k * 52, 14 + r * 46, 46, 38)
  })
}

/* ---------- objects ---------- */

function Selectable({ id, active, onSelect, children }: { id: GearId; active: GearId | null; onSelect: (id: GearId) => void; children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const s = hover || active === id ? 1.035 : 1
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 10, dt))
  })
  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ""
      }}
    >
      {children}
    </group>
  )
}

const metal = <meshStandardMaterial color="#26262b" metalness={0.8} roughness={0.35} />
const black = <meshStandardMaterial color="#0c0c0e" metalness={0.3} roughness={0.5} />

function Monitor({ x, rotY, screen }: { x: number; rotY: number; screen: THREE.Texture }) {
  return (
    <group position={[x, 0, -1.78]} rotation={[0, rotY, 0]}>
      <RoundedBox args={[0.72, 0.42, 0.03]} radius={0.008} position={[0, 1.12, 0]}>
        {black}
      </RoundedBox>
      <mesh position={[0, 1.12, 0.0161]}>
        <planeGeometry args={[0.7, 0.394]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.94, -0.04]}>
        <boxGeometry args={[0.05, 0.36, 0.03]} />
        {metal}
      </mesh>
      <mesh position={[0, DESK_Y + 0.01, -0.02]}>
        <boxGeometry args={[0.24, 0.015, 0.18]} />
        {metal}
      </mesh>
    </group>
  )
}

function Desk() {
  return (
    <group>
      <RoundedBox args={[1.9, 0.045, 0.82]} radius={0.012} position={[0, DESK_Y - 0.02, -1.45]} receiveShadow>
        <meshStandardMaterial color="#1b1b1f" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, DESK_Y + 0.003, -1.3]}>
        <boxGeometry args={[0.9, 0.004, 0.36]} />
        <meshStandardMaterial color="#121214" roughness={0.95} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <group key={x}>
          <mesh position={[x, DESK_Y / 2, -1.45]}>
            <boxGeometry args={[0.07, DESK_Y - 0.04, 0.07]} />
            {metal}
          </mesh>
          <mesh position={[x, 0.015, -1.45]}>
            <boxGeometry args={[0.08, 0.03, 0.7]} />
            {metal}
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#17140f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.6, -2.05]}>
        <planeGeometry args={[9, 3.2]} />
        <meshStandardMaterial color="#121216" roughness={1} />
      </mesh>
      <mesh position={[-2.6, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9, 3.2]} />
        <meshStandardMaterial color="#0f0f13" roughness={1} />
      </mesh>
      {/* bias lighting behind the monitors */}
      <mesh position={[0, 1.18, -2.04]}>
        <planeGeometry args={[1.7, 0.6]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.18} toneMapped={false} />
      </mesh>
      {/* rug */}
      <mesh position={[0.1, 0.004, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 48]} />
        <meshStandardMaterial color="#3a3446" roughness={1} />
      </mesh>
    </group>
  )
}

function Chair() {
  const legs = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2)
  return (
    <group position={[0.05, 0, -0.62]} rotation={[0, -0.35, 0]}>
      {legs.map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh position={[0.17, 0.07, 0]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.34, 0.03, 0.05]} />
            {black}
          </mesh>
          <mesh position={[0.33, 0.03, 0]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            {black}
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.4, 16]} />
        {metal}
      </mesh>
      <RoundedBox args={[0.52, 0.08, 0.5]} radius={0.035} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#1d1d22" roughness={0.9} />
      </RoundedBox>
      {/* the Leap's flexing back */}
      <RoundedBox args={[0.47, 0.62, 0.07]} radius={0.04} position={[0, 0.92, 0.25]} rotation={[-0.12, 0, 0]}>
        <meshStandardMaterial color="#1d1d22" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.66, 0.27]}>
        <boxGeometry args={[0.06, 0.26, 0.04]} />
        {black}
      </mesh>
      {[-0.27, 0.27].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.62, 0.02]}>
            <boxGeometry args={[0.03, 0.2, 0.03]} />
            {black}
          </mesh>
          <RoundedBox args={[0.07, 0.025, 0.24]} radius={0.01} position={[x, 0.73, 0.0]}>
            {black}
          </RoundedBox>
        </group>
      ))}
    </group>
  )
}

/** The desk and everything on it. `room` swaps the surrounding shell (the full room or the diorama's cutaway). */
export function Scene({
  active,
  onSelect,
  room = <Room />,
}: {
  active: GearId | null
  onSelect: (id: GearId) => void
  room?: ReactNode
}) {
  const tex = useMemo(
    () => ({
      code: codeScreen(),
      browser: browserScreen(),
      laptop: laptopScreen(),
      deck: streamDeckKeys(),
      keys: keyboardKeys(),
    }),
    [],
  )
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex])

  return (
    <group>
      {room}
      <Desk />

      <Selectable id="monitors" active={active} onSelect={onSelect}>
        <Monitor x={-0.37} rotY={0.16} screen={tex.code} />
        <Monitor x={0.37} rotY={-0.16} screen={tex.browser} />
      </Selectable>

      <Selectable id="macbook" active={active} onSelect={onSelect}>
        <group position={[0.95, DESK_Y, -1.42]} rotation={[0, -0.45, 0]}>
          <mesh position={[0, 0.05, 0]} rotation={[-0.35, 0, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.012]} />
            {metal}
          </mesh>
          <group position={[0, 0.09, 0.03]} rotation={[-0.35, 0, 0]}>
            <RoundedBox args={[0.31, 0.012, 0.22]} radius={0.004}>
              <meshStandardMaterial color="#3a3a40" metalness={0.85} roughness={0.3} />
            </RoundedBox>
            <group position={[0, 0.006, -0.11]} rotation={[-1.2, 0, 0]}>
              <RoundedBox args={[0.31, 0.21, 0.008]} radius={0.004} position={[0, 0.105, 0]}>
                <meshStandardMaterial color="#3a3a40" metalness={0.85} roughness={0.3} />
              </RoundedBox>
              <mesh position={[0, 0.105, 0.0045]}>
                <planeGeometry args={[0.29, 0.19]} />
                <meshBasicMaterial map={tex.laptop} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>
      </Selectable>

      <Selectable id="keyboard" active={active} onSelect={onSelect}>
        <group position={[-0.05, DESK_Y + 0.016, -1.25]} rotation={[0.05, 0, 0]}>
          <RoundedBox args={[0.43, 0.02, 0.13]} radius={0.006}>
            <meshStandardMaterial color="#2a2a2d" roughness={0.6} />
          </RoundedBox>
          <mesh position={[0, 0.0105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.42, 0.125]} />
            <meshStandardMaterial map={tex.keys} roughness={0.7} />
          </mesh>
        </group>
      </Selectable>

      <Selectable id="mouse" active={active} onSelect={onSelect}>
        <mesh position={[0.34, DESK_Y + 0.022, -1.22]} scale={[0.036, 0.022, 0.06]} rotation={[0, -0.15, 0]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#2c2c31" roughness={0.45} />
        </mesh>
      </Selectable>

      <Selectable id="streamdeck" active={active} onSelect={onSelect}>
        <group position={[-0.48, DESK_Y + 0.03, -1.3]} rotation={[-0.5, 0.2, 0]}>
          <RoundedBox args={[0.12, 0.085, 0.022]} radius={0.006}>
            {black}
          </RoundedBox>
          <mesh position={[0, 0, 0.0115]}>
            <planeGeometry args={[0.105, 0.065]} />
            <meshBasicMaterial map={tex.deck} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.03, -0.03]} rotation={[0.9, 0, 0]}>
            <boxGeometry args={[0.08, 0.05, 0.01]} />
            {black}
          </mesh>
        </group>
      </Selectable>

      <Selectable id="mic" active={active} onSelect={onSelect}>
        <group position={[-0.8, DESK_Y, -1.45]} rotation={[0, 0.5, 0]}>
          <mesh position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.07, 0.075, 0.024, 32]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.012, 0.08, 0.06]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <capsuleGeometry args={[0.045, 0.13, 8, 24]} />
            <meshStandardMaterial color="#c0c4cc" metalness={0.85} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.046, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#8a8f98" metalness={0.6} roughness={0.6} wireframe />
          </mesh>
        </group>
      </Selectable>

      <Selectable id="speakers" active={active} onSelect={onSelect}>
        {[-0.88, 0.88].map((x) => (
          <group key={x} position={[x, DESK_Y + 0.1, -1.78]} rotation={[0, -Math.sign(x) * 0.3, 0]}>
            <RoundedBox args={[0.085, 0.2, 0.09]} radius={0.01}>
              {black}
            </RoundedBox>
            <mesh position={[0, 0.02, 0.0455]}>
              <circleGeometry args={[0.03, 24]} />
              <meshStandardMaterial color="#1f1f23" roughness={0.9} />
            </mesh>
          </group>
        ))}
        <RoundedBox args={[0.26, 0.3, 0.28]} radius={0.015} position={[0.55, 0.15, -1.72]}>
          {black}
        </RoundedBox>
        <mesh position={[0.55, 0.15, -1.579]}>
          <circleGeometry args={[0.08, 32]} />
          <meshStandardMaterial color="#18181b" roughness={0.9} />
        </mesh>
      </Selectable>

      <Selectable id="airpods" active={active} onSelect={onSelect}>
        {[0, 1].map((i) => (
          <RoundedBox
            key={i}
            args={[0.06, 0.024, 0.048]}
            radius={0.011}
            position={[0.6 + i * 0.075, DESK_Y + 0.012, -1.18 - i * 0.03]}
            rotation={[0, 0.3 + i * 0.4, 0]}
          >
            <meshStandardMaterial color="#f4f4f5" roughness={0.25} />
          </RoundedBox>
        ))}
      </Selectable>

      <Selectable id="chair" active={active} onSelect={onSelect}>
        <Chair />
      </Selectable>
    </group>
  )
}

function Hotspots({ active, onSelect }: { active: GearId | null; onSelect: (id: GearId) => void }) {
  return (
    <>
      {GEAR.map((item, i) => {
        const on = active === item.id
        return (
          <Html key={item.id} position={FOCUS[item.id].hotspot} center zIndexRange={[20, 0]}>
            <button
              onClick={() => onSelect(item.id)}
              aria-label={`${item.maker} ${item.name}`}
              className={`group/hs flex items-center gap-2 whitespace-nowrap rounded-full border text-[11px] font-medium backdrop-blur-md transition-all duration-300 ${
                on
                  ? "border-white/60 bg-white px-2.5 py-1 text-black"
                  : "border-white/20 bg-black/60 p-0 text-white hover:bg-black/80"
              }`}
            >
              <span
                className={`grid place-items-center rounded-full text-[10px] tabular-nums ${
                  on ? "size-4 bg-black text-white" : "size-6"
                }`}
              >
                {i + 1}
              </span>
              {on && <span className="pr-0.5">{item.name}</span>}
            </button>
          </Html>
        )
      })}
    </>
  )
}

/** Eases camera + orbit target toward the selected item (or home), then lets go. */
function CameraRig({ active, intro }: { active: GearId | null; intro: boolean }) {
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null
  const goal = useRef({ target: HOME.target.clone(), camera: HOME.camera.clone(), moving: true })

  useEffect(() => {
    const f = active ? FOCUS[active] : null
    goal.current = {
      target: f ? new THREE.Vector3(...f.target) : HOME.target.clone(),
      camera: f ? new THREE.Vector3(...f.camera) : HOME.camera.clone(),
      moving: true,
    }
  }, [active])

  useEffect(() => {
    if (!controls) return
    const stop = () => (goal.current.moving = false)
    controls.addEventListener("start", stop)
    return () => controls.removeEventListener("start", stop)
  }, [controls])

  useFrame((state, dt) => {
    const c = state.controls as unknown as OrbitControlsImpl | null
    if (!c || !goal.current.moving) return
    const k = intro ? 1.6 : 3.2
    const g = goal.current
    c.target.set(
      THREE.MathUtils.damp(c.target.x, g.target.x, k, dt),
      THREE.MathUtils.damp(c.target.y, g.target.y, k, dt),
      THREE.MathUtils.damp(c.target.z, g.target.z, k, dt),
    )
    const p = state.camera.position
    p.set(
      THREE.MathUtils.damp(p.x, g.camera.x, k, dt),
      THREE.MathUtils.damp(p.y, g.camera.y, k, dt),
      THREE.MathUtils.damp(p.z, g.camera.z, k, dt),
    )
    c.update()
    if (p.distanceTo(g.camera) < 0.005) g.moving = false
  })
  return null
}

/** Desk lamp warmth, violet bias glow from the monitors, and a soft studio environment. */
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 1.25, -1.5]} intensity={1.6} distance={2.6} color="#a78bfa" />
      <spotLight position={[-1.6, 2.6, 0.6]} angle={0.55} penumbra={0.8} intensity={14} color="#fff3e0" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 3, 1]} scale={[4, 1, 1]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#8b5cf6" position={[-3, 1, -1]} scale={[2, 2, 1]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={0.8} position={[3, 1.5, 1]} scale={[2, 2, 1]} rotation={[0, -Math.PI / 2, 0]} />
      </Environment>
    </>
  )
}

/**
 * A floating cut-away of the room for the About page: a floor slab with two
 * walls, open on the viewer's sides like a dollhouse, so the desk reads at a
 * glance from a three-quarter angle.
 */
export function DioramaRoom() {
  const wall = <meshStandardMaterial color="#2c2a36" roughness={0.95} />
  return (
    <group>
      {/* wood floor on a dark plinth, so it reads as a model */}
      <mesh position={[0, -0.03, -0.85]}>
        <boxGeometry args={[3.0, 0.06, 2.6]} />
        <meshStandardMaterial color="#4a3524" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.16, -0.85]}>
        <boxGeometry args={[3.08, 0.2, 2.68]} />
        <meshStandardMaterial color="#0d0c10" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.05, -2.1]}>
        <boxGeometry args={[3.0, 2.24, 0.1]} />
        {wall}
      </mesh>
      <mesh position={[-1.55, 1.05, -0.85]}>
        <boxGeometry args={[0.1, 2.24, 2.6]} />
        {wall}
      </mesh>
      {/* bias lighting behind the monitors */}
      <mesh position={[0, 1.18, -2.044]}>
        <planeGeometry args={[1.7, 0.6]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.22} toneMapped={false} />
      </mesh>
      {/* a framed print on the side wall */}
      <mesh position={[-1.497, 1.45, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.55, 0.38]} />
        <meshStandardMaterial color="#2a2340" emissive="#4c1d95" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.1, 0.004, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 48]} />
        <meshStandardMaterial color="#3a3446" roughness={1} />
      </mesh>
    </group>
  )
}

export default function DeskScene({ active, onSelect }: { active: GearId | null; onSelect: (id: GearId | null) => void }) {
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [3.6, 2.6, 2.6], fov: 38, near: 0.05, far: 40 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#060608"]} />
      <fog attach="fog" args={["#060608", 4.5, 9]} />
      <SceneLights />

      <Scene active={active} onSelect={onSelect} />
      <Hotspots active={active} onSelect={onSelect} />
      <ContactShadows position={[0, 0.002, -0.9]} scale={6} blur={2.4} opacity={0.65} far={1.6} frames={1} resolution={512} />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={0.6}
        maxDistance={4.8}
        minPolarAngle={0.35}
        maxPolarAngle={1.45}
        minAzimuthAngle={-0.6}
        maxAzimuthAngle={1.35}
        target={HOME.target.toArray() as [number, number, number]}
      />
      <CameraRig active={active} intro={intro} />
    </Canvas>
  )
}
