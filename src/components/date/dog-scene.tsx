"use client"

import * as THREE from "three"
import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

export type DogMood = "idle" | "sad" | "happy" | "party"
export type DogLayout = "hero" | "compact" | "poster"

export interface DogSceneProps {
  mood: DogMood
  /** How many times "no" has been pressed. Drives droop and, eventually, tears. */
  sadness: number
  layout: DogLayout
  /** Bump to fire a burst of hearts. */
  burst: number
  /** Bump when the dog gets tapped. */
  boop: number
  onReady?: () => void
}

const C = {
  fur: "#f1b57c",
  furDark: "#d98a4f",
  cream: "#fff3e3",
  nose: "#2a1c19",
  eye: "#1b1210",
  blush: "#ff8fa6",
  tongue: "#ff6b84",
  rose: "#e3194b",
  roseDeep: "#a10f35",
  leaf: "#3f9a50",
  collar: "#ff4d6d",
  gold: "#f6c445",
  tear: "#9fd8ff",
}

type V3 = [number, number, number]

// Shared by every listener; written from window events, read every frame.
const pointer = { x: 0, y: 0 }

const damp = THREE.MathUtils.damp

/** A capsule spanning two points: arms, mostly. */
function Limb({ from, to, radius, material }: { from: V3; to: V3; radius: number; material: THREE.Material }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const dir = b.clone().sub(a)
    const length = dir.length()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    return { position: a.add(b).multiplyScalar(0.5), quaternion, length }
  }, [from, to])
  return (
    <mesh position={position} quaternion={quaternion} material={material}>
      <capsuleGeometry args={[radius, length, 8, 16]} />
    </mesh>
  )
}

const LEFT_ARM: [V3, V3] = [
  [-0.25, 0.93, 0.18],
  [0.03, 0.74, 0.58],
]
const RIGHT_ARM: [V3, V3] = [
  [0.25, 0.96, 0.18],
  [0.15, 0.88, 0.58],
]

function Rose({ sphere }: { sphere: THREE.BufferGeometry }) {
  const mats = useMemo(
    () => ({
      petal: new THREE.MeshPhysicalMaterial({
        color: C.rose,
        roughness: 0.42,
        sheen: 0.8,
        sheenColor: new THREE.Color("#ff9db5"),
        clearcoat: 0.3,
      }),
      core: new THREE.MeshPhysicalMaterial({ color: C.roseDeep, roughness: 0.5, sheen: 0.5 }),
      leaf: new THREE.MeshStandardMaterial({ color: C.leaf, roughness: 0.55 }),
    }),
    [],
  )
  const stem = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.015, 0.3, 0.01),
          new THREE.Vector3(-0.01, 0.6, 0),
          new THREE.Vector3(0, 0.86, 0),
        ]),
        24,
        0.022,
        8,
      ),
    [],
  )
  const petals = useMemo(() => {
    const rings = [
      { n: 3, r: 0.045, tilt: 0.18, w: 0.075, h: 0.1, off: 0 },
      { n: 5, r: 0.07, tilt: 0.55, w: 0.088, h: 0.11, off: 0.6 },
      { n: 6, r: 0.088, tilt: 0.98, w: 0.095, h: 0.1, off: 0.25 },
    ]
    const out: { key: string; rotY: number; pos: V3; tilt: number; scale: V3 }[] = []
    rings.forEach((ring, i) => {
      for (let k = 0; k < ring.n; k++) {
        out.push({
          key: `${i}-${k}`,
          rotY: (k / ring.n) * Math.PI * 2 + ring.off,
          pos: [0, 0.04 + ring.h * 0.55 * Math.cos(ring.tilt), ring.r + ring.h * 0.55 * Math.sin(ring.tilt)],
          tilt: ring.tilt,
          scale: [ring.w, ring.h, 0.028],
        })
      }
    })
    return out
  }, [])

  return (
    // Held diagonally across the chest, bloom up by the right cheek.
    <group position={[-0.1, 0.42, 0.6]} rotation={[0.12, 0, -0.5]}>
      <mesh geometry={stem} material={mats.leaf} />
      {[
        { y: 0.36, side: 1 },
        { y: 0.55, side: -1 },
      ].map(({ y, side }) => (
        <mesh
          key={y}
          geometry={sphere}
          material={mats.leaf}
          position={[side * 0.07, y, 0]}
          rotation={[0, 0, side * -0.9]}
          scale={[0.04, 0.085, 0.015]}
        />
      ))}
      <group position={[0, 0.86, 0]} scale={1.2}>
        {Array.from({ length: 5 }, (_, k) => (
          <group key={k} rotation={[0, (k / 5) * Math.PI * 2, 0]}>
            <mesh geometry={sphere} material={mats.leaf} position={[0, -0.005, 0.05]} rotation={[1.25, 0, 0]} scale={[0.025, 0.06, 0.01]} />
          </group>
        ))}
        <mesh geometry={sphere} material={mats.core} position={[0, 0.11, 0]} scale={[0.07, 0.095, 0.07]} />
        {petals.map((p) => (
          <group key={p.key} rotation={[0, p.rotY, 0]}>
            <mesh geometry={sphere} material={mats.petal} position={p.pos} rotation={[p.tilt, 0, 0]} scale={p.scale} />
          </group>
        ))}
      </group>
    </group>
  )
}

/** Puppy, sitting, holding a rose. Every pose change is damped so moods blend. */
function Dog({ mood, sadness, layout, boop }: Pick<DogSceneProps, "mood" | "sadness" | "layout" | "boop">) {
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 36, 26), [])
  const smileArc = useMemo(() => new THREE.TorusGeometry(0.045, 0.012, 8, 20, Math.PI), [])
  const happyEyeArc = useMemo(() => new THREE.TorusGeometry(0.06, 0.017, 8, 20, Math.PI), [])
  const tail = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.16, -0.16),
          new THREE.Vector3(0, 0.38, -0.14),
          new THREE.Vector3(0, 0.46, 0.0),
        ]),
        20,
        0.075,
        10,
      ),
    [],
  )
  const shadowTex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = c.height = 128
    const g = c.getContext("2d")!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, "rgba(120,40,60,0.38)")
    grad.addColorStop(0.55, "rgba(120,40,60,0.14)")
    grad.addColorStop(1, "rgba(120,40,60,0)")
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  const m = useMemo(
    () => ({
      // Sheen gives the clay a soft, fuzzy edge where it turns from the light.
      fur: new THREE.MeshPhysicalMaterial({
        color: C.fur,
        roughness: 0.72,
        sheen: 1,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color("#fff0dc"),
      }),
      furDark: new THREE.MeshPhysicalMaterial({
        color: C.furDark,
        roughness: 0.75,
        sheen: 1,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color("#ffe1c4"),
      }),
      cream: new THREE.MeshPhysicalMaterial({
        color: C.cream,
        roughness: 0.7,
        sheen: 1,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color("#ffffff"),
      }),
      nose: new THREE.MeshPhysicalMaterial({ color: C.nose, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }),
      eye: new THREE.MeshPhysicalMaterial({ color: C.eye, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
      shine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      blush: new THREE.MeshBasicMaterial({ color: C.blush, transparent: true, opacity: 0.55, depthWrite: false }),
      tongue: new THREE.MeshPhysicalMaterial({ color: C.tongue, roughness: 0.35, clearcoat: 0.6 }),
      collar: new THREE.MeshPhysicalMaterial({ color: C.collar, roughness: 0.4, clearcoat: 0.5 }),
      gold: new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.9, roughness: 0.25 }),
    }),
    [],
  )

  const place = useRef<THREE.Group>(null)
  const hop = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const earL = useRef<THREE.Group>(null)
  const earR = useRef<THREE.Group>(null)
  const eyeL = useRef<THREE.Group>(null)
  const eyeR = useRef<THREE.Group>(null)
  const happyEyes = useRef<THREE.Group>(null)
  const browL = useRef<THREE.Mesh>(null)
  const browR = useRef<THREE.Mesh>(null)
  const smile = useRef<THREE.Group>(null)
  const frown = useRef<THREE.Mesh>(null)
  const tongue = useRef<THREE.Mesh>(null)
  const tailRef = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const tears = useRef<THREE.Group>(null)

  const st = useRef({
    scale: 0,
    scaleVel: 0,
    squash: 0,
    squashVel: 0,
    nextBlink: 2,
    blinkAt: -1,
    lastBoop: boop,
    boopAt: -10,
    spinFrom: 0,
  })

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime
    const s = st.current
    const vw = state.viewport.width
    const vh = state.viewport.height

    // --- where the dog sits on screen, as a fraction of the viewport ---
    const wide = vw / vh > 1.1
    const spec =
      layout === "poster"
        ? { x: -vw * 0.24, center: 0.5, height: 0.78 }
        : layout === "compact"
          ? { x: 0, center: 0.105, height: 0.15 }
          : { x: 0, center: wide ? 0.25 : 0.235, height: wide ? 0.36 : 0.31 }
    const targetScale = Math.min((spec.height * vh) / 2.25, (0.62 * vw) / 1.7)
    // A spring rather than a damp, so the entrance and layout changes overshoot a touch.
    s.scaleVel += (targetScale - s.scale) * 90 * dt
    s.scaleVel *= Math.exp(-11 * dt)
    s.scale += s.scaleVel * dt

    if (boop !== s.lastBoop) {
      s.lastBoop = boop
      s.boopAt = t
      s.squashVel += 5
    }
    s.squashVel += -s.squash * 260 * dt
    s.squashVel *= Math.exp(-9 * dt)
    s.squash += s.squashVel * dt

    const pl = place.current!
    pl.position.x = damp(pl.position.x, spec.x, 6, dt)
    pl.position.y = damp(pl.position.y, vh / 2 - spec.center * vh - 1.12 * s.scale, 6, dt)
    pl.scale.setScalar(Math.max(0.0001, s.scale))

    const happy = mood === "happy" || mood === "party"
    const sad = mood === "sad"
    const booped = t - s.boopAt < 0.9

    // --- hops and spins ---
    let hopY = 0
    let spin = 0
    if (happy) {
      const period = mood === "party" ? 1.25 : 1.7
      const ph = (t % period) / period
      if (ph < 0.32) hopY = Math.sin((ph / 0.32) * Math.PI) * (mood === "party" ? 0.38 : 0.22)
      if (mood === "party" && Math.floor(t / period) % 3 === 0 && ph < 0.32) spin = (ph / 0.32) * Math.PI * 2
    }
    if (booped) hopY = Math.max(hopY, Math.sin(Math.min(1, (t - s.boopAt) / 0.4) * Math.PI) * 0.18)
    hop.current!.position.y = hopY
    hop.current!.rotation.y = spin
    const sh = shadow.current!
    sh.scale.setScalar(1.7 * (1 - hopY * 0.9))

    // --- body: sway, breathe, squash, shiver ---
    const b = body.current!
    const shiver = sad ? Math.sin(t * 38) * 0.006 * Math.min(sadness, 6) : 0
    b.position.x = shiver
    b.rotation.y = damp(b.rotation.y, Math.sin(t * 0.55) * 0.2 - 0.12 + pointer.x * 0.12, 3, dt)
    b.rotation.x = layout === "poster" ? 0.05 : 0.1
    const breathe = 1 + Math.sin(t * 2.2) * 0.012
    b.scale.set(1 + s.squash * 0.5, (1 - s.squash) * breathe, 1 + s.squash * 0.5)

    // --- head: follows the pointer, droops when sad ---
    const h = head.current!
    const lookDown = layout === "compact" ? 0.16 : 0
    const sadPitch = sad ? 0.16 + Math.min(sadness, 6) * 0.025 : 0
    h.rotation.y = damp(h.rotation.y, pointer.x * 0.5, 5, dt)
    h.rotation.x = damp(h.rotation.x, -pointer.y * 0.22 + lookDown + sadPitch, 5, dt)
    h.rotation.z = damp(h.rotation.z, Math.sin(t * 0.9) * 0.08 + (sad ? 0.12 : 0) + (happy ? Math.sin(t * 3) * 0.06 : 0), 4, dt)

    // --- ears ---
    const earOpen = happy || booped ? 1.0 : sad ? 0.14 : 0.62
    const flop = Math.sin(t * 2.4) * 0.05 + hopY * 0.6
    earL.current!.rotation.z = damp(earL.current!.rotation.z, -earOpen - flop, 6, dt)
    earR.current!.rotation.z = damp(earR.current!.rotation.z, earOpen + flop, 6, dt)
    earL.current!.rotation.x = earR.current!.rotation.x = damp(earR.current!.rotation.x, sad ? 0.35 : 0.12, 5, dt)

    // --- eyes: blink, puppy-eye swell, ^^ when happy ---
    if (t > s.nextBlink) {
      s.blinkAt = t
      s.nextBlink = t + 2.2 + Math.random() * 3
    }
    const bt = (t - s.blinkAt) / 0.15
    const blink = bt >= 0 && bt < 1 ? 1 - Math.sin(bt * Math.PI) * 0.92 : 1
    const swell = sad ? 1.12 + Math.min(sadness, 6) * 0.025 : 1
    const showHappy = happy || booped
    for (const e of [eyeL.current!, eyeR.current!]) {
      const sc = damp(e.scale.x, swell, 6, dt)
      e.scale.set(sc, sc * blink, sc)
      e.visible = !showHappy
    }
    happyEyes.current!.visible = showHappy
    browL.current!.rotation.z = damp(browL.current!.rotation.z, sad ? 0.5 : 0, 6, dt)
    browR.current!.rotation.z = damp(browR.current!.rotation.z, sad ? -0.5 : 0, 6, dt)
    browL.current!.position.y = browR.current!.position.y = damp(browR.current!.position.y, sad ? 0.33 : 0.3, 6, dt)

    smile.current!.visible = !sad
    frown.current!.visible = sad
    const tg = tongue.current!
    tg.scale.y = damp(tg.scale.y, showHappy ? 0.085 : 0.0001, 8, dt)
    tg.rotation.x = Math.sin(t * 9) * (happy ? 0.12 : 0)

    // --- tail ---
    const wag = happy ? 15 : sad ? 0 : 6
    const amp = happy ? 0.55 : sad ? 0 : 0.3
    tailRef.current!.rotation.z = Math.sin(t * wag) * amp
    tailRef.current!.rotation.x = damp(tailRef.current!.rotation.x, sad ? 0.9 : 0, 4, dt)

    // --- tears, once it's been bad enough ---
    const tg2 = tears.current!
    tg2.visible = sad && sadness >= 5
    if (tg2.visible) {
      tg2.children.forEach((tear, i) => {
        const p = ((t + i * 0.6) % 1.3) / 1.3
        tear.position.y = 0.04 - p * 0.32
        tear.position.z = 0.5 - p * 0.04
        tear.scale.setScalar(0.035 * Math.sin(Math.min(1, p * 1.4) * Math.PI) + 0.0001)
      })
    }
  })

  return (
    <group ref={place} scale={0.0001}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.05]} renderOrder={-1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
      <group ref={hop}>
        <group ref={body}>
          {/* torso, haunches, feet */}
          <mesh geometry={sphere} material={m.fur} position={[0, 0.62, 0]} scale={[0.56, 0.62, 0.5]} />
          <mesh geometry={sphere} material={m.cream} position={[0, 0.66, 0.24]} scale={[0.4, 0.5, 0.31]} />
          {[-1, 1].map((x) => (
            <group key={x}>
              <mesh geometry={sphere} material={m.fur} position={[x * 0.34, 0.3, -0.04]} scale={[0.3, 0.3, 0.36]} />
              <mesh geometry={sphere} material={m.cream} position={[x * 0.33, 0.07, 0.27]} scale={[0.15, 0.085, 0.22]} />
            </group>
          ))}

          {/* tail, curled over the back */}
          <group ref={tailRef} position={[0, 0.32, -0.42]}>
            <mesh geometry={tail} material={m.fur} />
            <mesh geometry={sphere} material={m.cream} position={[0, 0.46, 0.0]} scale={0.095} />
          </group>

          {/* collar and tag */}
          <mesh position={[0, 1.17, 0.04]} rotation={[Math.PI / 2 - 0.28, 0, 0]} material={m.collar}>
            <torusGeometry args={[0.29, 0.05, 12, 40]} />
          </mesh>
          <mesh position={[0, 1.05, 0.34]} rotation={[Math.PI / 2 - 0.3, 0, 0]} material={m.gold}>
            <cylinderGeometry args={[0.055, 0.055, 0.02, 24]} />
          </mesh>

          {/* arms, paws, and the rose they're holding */}
          <Limb from={LEFT_ARM[0]} to={LEFT_ARM[1]} radius={0.095} material={m.fur} />
          <Limb from={RIGHT_ARM[0]} to={RIGHT_ARM[1]} radius={0.095} material={m.fur} />
          <Rose sphere={sphere} />
          <mesh geometry={sphere} material={m.cream} position={LEFT_ARM[1]} scale={[0.115, 0.105, 0.11]} />
          <mesh geometry={sphere} material={m.cream} position={RIGHT_ARM[1]} scale={[0.115, 0.105, 0.11]} />

          {/* head pivots at the neck */}
          <group ref={head} position={[0, 1.5, 0.04]}>
            <mesh geometry={sphere} material={m.fur} position={[0, 0.14, 0]} scale={[0.62, 0.55, 0.56]} />
            {[-1, 1].map((x) => (
              <mesh key={x} geometry={sphere} material={m.fur} position={[x * 0.3, -0.02, 0.17]} scale={[0.3, 0.25, 0.28]} />
            ))}
            <mesh geometry={sphere} material={m.cream} position={[0, -0.05, 0.41]} scale={[0.27, 0.19, 0.22]} />
            <mesh geometry={sphere} material={m.nose} position={[0, 0.04, 0.615]} scale={[0.085, 0.06, 0.055]} />

            {/* mouth: a little "w", or a frown */}
            <group ref={smile} position={[0, -0.075, 0.625]}>
              {[-1, 1].map((x) => (
                <mesh key={x} geometry={smileArc} material={m.nose} position={[x * 0.044, 0, 0]} rotation={[0, 0, Math.PI]} />
              ))}
            </group>
            <mesh ref={frown} geometry={smileArc} material={m.nose} position={[0, -0.115, 0.62]} visible={false} />
            <mesh ref={tongue} geometry={sphere} material={m.tongue} position={[0, -0.14, 0.6]} scale={[0.055, 0.0001, 0.03]} />

            {/* eyes */}
            {[-1, 1].map((x) => (
              <group key={x} ref={x < 0 ? eyeL : eyeR} position={[x * 0.22, 0.13, 0.5]}>
                <mesh geometry={sphere} material={m.eye} scale={[0.078, 0.092, 0.05]} />
                <mesh geometry={sphere} material={m.shine} position={[0.026, 0.032, 0.045]} scale={0.025} />
                <mesh geometry={sphere} material={m.shine} position={[-0.022, -0.03, 0.045]} scale={0.012} />
              </group>
            ))}
            <group ref={happyEyes} visible={false}>
              {[-1, 1].map((x) => (
                <mesh key={x} geometry={happyEyeArc} material={m.eye} position={[x * 0.22, 0.11, 0.53]} rotation={[-0.2, 0, 0]} />
              ))}
            </group>
            <mesh ref={browL} geometry={sphere} material={m.furDark} position={[-0.2, 0.3, 0.49]} scale={[0.055, 0.032, 0.03]} />
            <mesh ref={browR} geometry={sphere} material={m.furDark} position={[0.2, 0.3, 0.49]} scale={[0.055, 0.032, 0.03]} />
            {[-1, 1].map((x) => (
              <mesh
                key={x}
                geometry={sphere}
                material={m.blush}
                position={[x * 0.33, -0.05, 0.42]}
                rotation={[0, x * 0.7, 0]}
                scale={[0.075, 0.045, 0.02]}
              />
            ))}

            {/* tears */}
            <group ref={tears} visible={false}>
              {[-1, 1].map((x) => (
                <mesh key={x} geometry={sphere} position={[x * 0.24, 0, 0.5]} scale={0.0001}>
                  <meshPhysicalMaterial color={C.tear} roughness={0.05} clearcoat={1} transparent opacity={0.9} />
                </mesh>
              ))}
            </group>

            {/* floppy ears, hinged at the top */}
            {[-1, 1].map((x) => (
              <group key={x} ref={x < 0 ? earL : earR} position={[x * 0.43, 0.42, 0.06]}>
                <mesh geometry={sphere} material={m.furDark} position={[0, -0.23, 0]} scale={[0.16, 0.3, 0.075]} />
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
}

const MAX_HEARTS = 40

/** A pool of glossy hearts. Bursts on demand; drifts up continuously in party mode. */
function Hearts({ burst, boop, mood, layout }: Pick<DogSceneProps, "burst" | "boop" | "mood" | "layout">) {
  const geo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(5, 5)
    s.bezierCurveTo(5, 5, 4, 0, 0, 0)
    s.bezierCurveTo(-6, 0, -6, 7, -6, 7)
    s.bezierCurveTo(-6, 11, -3, 15.4, 5, 19)
    s.bezierCurveTo(12, 15.4, 16, 11, 16, 7)
    s.bezierCurveTo(16, 7, 16, 0, 10, 0)
    s.bezierCurveTo(7, 0, 5, 5, 5, 5)
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 3.2,
      bevelSize: 2.4,
      bevelSegments: 8,
      curveSegments: 20,
    })
    g.center()
    g.rotateZ(Math.PI)
    g.scale(1 / 22, 1 / 22, 1 / 22)
    return g
  }, [])
  const mats = useMemo(
    () => [
      new THREE.MeshPhysicalMaterial({ color: "#ff3d6e", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ color: "#ff8fab", roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ color: "#e0123f", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }),
    ],
    [],
  )
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const pool = useRef(
    Array.from({ length: MAX_HEARTS }, () => ({
      alive: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      spin: new THREE.Vector3(),
      age: 0,
      life: 1,
      size: 1,
      gravity: 1,
    })),
  )
  const seen = useRef({ burst, boop, drip: 0 })

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const vw = state.viewport.width
    const vh = state.viewport.height
    const unit = Math.min(vh * (layout === "compact" ? 0.15 : 0.34), vw * 0.62) / 2.25
    const centerFrac = layout === "compact" ? 0.105 : layout === "poster" ? 0.5 : 0.24
    const origin = new THREE.Vector3(layout === "poster" ? -vw * 0.24 : 0, vh / 2 - centerFrac * vh, 1)

    const spawn = (n: number, power: number, gentle = false) => {
      let made = 0
      for (const h of pool.current) {
        if (made >= n) break
        if (h.alive) continue
        made++
        h.alive = true
        h.age = 0
        h.life = gentle ? 3 + Math.random() * 1.5 : 1.5 + Math.random() * 0.9
        h.size = unit * (gentle ? 0.18 + Math.random() * 0.14 : 0.2 + Math.random() * 0.2)
        h.gravity = gentle ? -0.15 : 1
        h.pos.copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * unit * (gentle ? 3.5 : 0.6), gentle ? -vh * 0.1 : 0, 0))
        const a = Math.random() * Math.PI * 2
        h.vel.set(
          Math.cos(a) * (gentle ? 0.2 : 1.6 + Math.random() * 2) * power,
          (gentle ? 0.5 + Math.random() * 0.5 : 2.6 + Math.random() * 2.6) * power,
          (gentle ? 0 : Math.random() * 1.2) * power,
        )
        h.spin.set((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 2.4, 0)
      }
    }

    const sk = seen.current
    if (burst !== sk.burst) {
      sk.burst = burst
      spawn(28, unit * 1.3)
    }
    if (boop !== sk.boop) {
      sk.boop = boop
      spawn(4, unit * 0.8)
    }
    if (mood === "party") {
      sk.drip += dt
      if (sk.drip > 0.35) {
        sk.drip = 0
        spawn(1, unit * 1.2, true)
      }
    }

    pool.current.forEach((h, i) => {
      const mesh = meshes.current[i]
      if (!mesh) return
      if (!h.alive) {
        mesh.visible = false
        return
      }
      h.age += dt
      if (h.age > h.life) {
        h.alive = false
        mesh.visible = false
        return
      }
      h.vel.y -= 4.2 * unit * h.gravity * dt
      h.vel.multiplyScalar(Math.exp(-0.6 * dt))
      h.pos.addScaledVector(h.vel, dt)
      mesh.visible = true
      mesh.position.copy(h.pos)
      mesh.rotation.x += h.spin.x * dt
      mesh.rotation.y += h.spin.y * dt
      mesh.rotation.z = Math.sin(h.age * 3 + i) * 0.4
      const k = h.age / h.life
      const pop = Math.min(1, h.age / 0.14)
      mesh.scale.setScalar(h.size * pop * (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1) + 0.0001)
    })
  })

  return (
    <group>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el
          }}
          geometry={geo}
          material={mats[i % mats.length]}
          visible={false}
        />
      ))}
    </group>
  )
}

export default function DogScene(props: DogSceneProps) {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    // On phones the head turns toward each tap, then drifts back to centre.
    let settle: ReturnType<typeof setTimeout> | undefined
    const onDown = (e: PointerEvent) => {
      onMove(e)
      if (e.pointerType !== "mouse") {
        clearTimeout(settle)
        settle = setTimeout(() => {
          pointer.x = 0
          pointer.y = 0
        }, 1400)
      }
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown)
      clearTimeout(settle)
    }
  }, [])

  const { onReady } = props
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        const pmrem = new THREE.PMREMGenerator(gl)
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
        scene.environmentIntensity = 0.42
        pmrem.dispose()
        onReady?.()
      }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
    >
      <hemisphereLight args={["#fff6ef", "#f6b3c4", 0.95]} />
      <directionalLight position={[3, 5, 7]} intensity={2.1} color="#fff1e4" />
      <directionalLight position={[-5, 3, -4]} intensity={1.8} color="#ffb0c6" />
      <Dog mood={props.mood} sadness={props.sadness} layout={props.layout} boop={props.boop} />
      <Hearts burst={props.burst} boop={props.boop} mood={props.mood} layout={props.layout} />
    </Canvas>
  )
}
