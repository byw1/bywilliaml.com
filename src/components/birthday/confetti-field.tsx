"use client";

import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { mulberry32 } from "@/lib/utils";

/** Party colours, kept inside the page's white-and-amber range. */
const PALETTE = ["#f7f5f2", "#f0b357", "#e08a4c", "#cfc7ff", "#ffffff"];

const COUNT = 70;
/** Half-extents of the box the shreds live in, in world units. */
const SPREAD = { x: 9, y: 7, z: 5 };

/**
 * Confetti drifting behind everything.
 *
 * One instanced mesh and one matrix write per frame — ninety separate meshes
 * would cost ninety draw calls for something nobody is meant to look straight
 * at. Positions and spins come from a seeded PRNG so the field is laid out the
 * same way on every load rather than reshuffling on each visit.
 */
export function ConfettiField() {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const shreds = useMemo(() => {
    const random = mulberry32(0x5eed17);
    return Array.from({ length: COUNT }, () => ({
      position: new THREE.Vector3(
        (random() * 2 - 1) * SPREAD.x,
        (random() * 2 - 1) * SPREAD.y,
        // Biased backwards so the field reads as depth behind the card rather
        // than as specks on the lens.
        -2.5 - random() * SPREAD.z,
      ),
      spin: new THREE.Vector3(
        random() * 0.9 - 0.45,
        random() * 0.9 - 0.45,
        random() * 0.9 - 0.45,
      ),
      rotation: new THREE.Euler(
        random() * Math.PI * 2,
        random() * Math.PI * 2,
        random() * Math.PI * 2,
      ),
      fall: 0.12 + random() * 0.34,
      sway: 0.3 + random() * 0.9,
      phase: random() * Math.PI * 2,
      scale: 0.6 + random() * 0.9,
      color: new THREE.Color(PALETTE[Math.floor(random() * PALETTE.length)]),
    }));
  }, []);

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      quaternion: new THREE.Quaternion(),
      scale: new THREE.Vector3(),
    }),
    [],
  );

  useLayoutEffect(() => {
    const instances = mesh.current;
    if (!instances) return;
    shreds.forEach((shred, index) => instances.setColorAt(index, shred.color));
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
  }, [shreds]);

  useFrame((state, delta) => {
    const instances = mesh.current;
    if (!instances) return;

    // A tab left in the background hands back one enormous delta on return.
    const step = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;

    shreds.forEach((shred, index) => {
      shred.position.y -= shred.fall * step;
      // Wrap rather than respawn, so the field never thins out.
      if (shred.position.y < -SPREAD.y) shred.position.y = SPREAD.y;

      shred.rotation.x += shred.spin.x * step;
      shred.rotation.y += shred.spin.y * step;
      shred.rotation.z += shred.spin.z * step;

      scratch.quaternion.setFromEuler(shred.rotation);
      scratch.scale.setScalar(shred.scale);
      scratch.matrix.compose(shred.position, scratch.quaternion, scratch.scale);
      // Sideways drift lives in the matrix rather than the stored position, so
      // it stays a sway instead of accumulating into a one-way slide.
      scratch.matrix.elements[12] +=
        Math.sin(time * 0.35 + shred.phase) * shred.sway;
      instances.setMatrixAt(index, scratch.matrix);
    });

    instances.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <planeGeometry args={[0.075, 0.115]} />
      <meshBasicMaterial
        side={THREE.DoubleSide}
        transparent
        opacity={0.42}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
