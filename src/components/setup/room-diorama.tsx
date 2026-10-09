"use client"

import * as THREE from "three"
import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { ContactShadows } from "@react-three/drei"
import { DioramaRoom, Scene, SceneLights } from "./desk-scene"

const CENTER: [number, number, number] = [0, 0, 0.85]

/** The room as a floating model: it sways on its own and swings toward the pointer. */
function Floating({ hover, pointer }: { hover: boolean; pointer: React.RefObject<{ x: number; y: number }> }) {
  const g = useRef<THREE.Group>(null)
  useFrame((state, dt) => {
    const el = g.current
    if (!el) return
    const t = state.clock.elapsedTime
    const p = pointer.current ?? { x: 0, y: 0 }
    const yaw = (hover ? p.x * 0.5 : Math.sin(t * 0.35) * 0.32) - 0.05
    const pitch = hover ? p.y * 0.12 : 0
    el.rotation.y = THREE.MathUtils.damp(el.rotation.y, yaw, 3, dt)
    el.rotation.x = THREE.MathUtils.damp(el.rotation.x, pitch, 3, dt)
    // Shrink on narrow canvases so the whole model always floats inside the card.
    const fit = Math.min(1, state.size.width / state.size.height / 1.45) * 0.74
    const s = THREE.MathUtils.damp(el.scale.x, fit * (hover ? 1.07 : 1), 4, dt)
    el.scale.setScalar(s)
    // Tall cards keep their caption at the bottom, so lift the model clear of it.
    el.position.y = Math.sin(t * 0.9) * 0.04 + (1 - fit / 0.74) * 0.55
  })
  return (
    <group ref={g}>
      {/* the room pivots around its own middle */}
      <group position={CENTER}>
        <Scene active={null} onSelect={() => {}} room={<DioramaRoom />} />
      </group>
    </group>
  )
}

export default function RoomDiorama({
  hover,
  visible,
  pointer,
}: {
  hover: boolean
  visible: boolean
  pointer: React.RefObject<{ x: number; y: number }>
}) {
  return (
    <Canvas
      // Stop rendering entirely while the card is off screen.
      frameloop={visible ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [3.9, 3.0, 3.9], fov: 32, near: 0.1, far: 30 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.45, 0)}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <SceneLights />
      <hemisphereLight args={["#c4b5fd", "#1a1206", 0.9]} />
      <directionalLight position={[3, 4, 2]} intensity={1.4} color="#fff3e0" />
      <Floating hover={hover} pointer={pointer} />
      <ContactShadows position={[0, -0.4, 0]} scale={7} blur={3} opacity={0.6} far={2} frames={1} resolution={256} />
    </Canvas>
  )
}
