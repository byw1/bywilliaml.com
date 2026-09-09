"use client";

import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Canvas,
  extend,
  useFrame,
  useThree,
  type ThreeElement,
  type ThreeEvent,
} from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import {
  MeshLineGeometry,
  MeshLineMaterial,
  type MeshLineMaterialParameters,
} from "meshline";
import {
  createBandTexture,
  createCardTexture,
  repaintWithWebFont,
} from "./invite-textures";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

/**
 * The badge model: a punched card, the clip that holds it and the clamp that
 * closes the strap. Only the geometry is used — the face is painted at runtime
 * by `invite-textures`, so nothing of the original artwork survives. Served
 * from `public/` rather than a CDN; see the README beside it.
 */
const TAG_MODEL = "/birthday/tag.glb";

if (typeof window !== "undefined") useGLTF.preload(TAG_MODEL);

interface TagModel {
  nodes: {
    card: THREE.Mesh;
    clip: THREE.Mesh;
    clamp: THREE.Mesh;
  };
  materials: {
    base: THREE.MeshStandardMaterial;
    metal: THREE.MeshStandardMaterial;
  };
}

/** Where the pointer grabbed the card, relative to the card's own origin. */
type Grab = THREE.Vector3 | null;

const SEGMENT = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 2,
  linearDamping: 2,
} as const;

/**
 * How fast the two middle rope segments chase their true physics positions.
 * Smoothing them keeps the drawn strap from jittering a frame behind the solver
 * while still snapping when the card is thrown.
 */
const MIN_FOLLOW = 10;
const MAX_FOLLOW = 50;

function Lanyard() {
  // The joint hooks want settled refs, and every read below is guarded, so the
  // refs are declared non-null and checked at use.
  const fixed = useRef<RapierRigidBody>(null!);
  const j1 = useRef<RapierRigidBody>(null!);
  const j2 = useRef<RapierRigidBody>(null!);
  const j3 = useRef<RapierRigidBody>(null!);
  const card = useRef<RapierRigidBody>(null!);
  const strap = useRef<MeshLineGeometry>(null);

  const [grab, setGrab] = useState<Grab>(null);
  const [hovered, setHovered] = useState(false);

  const { nodes, materials } = useGLTF(TAG_MODEL) as unknown as TagModel;
  const { width, height } = useThree((state) => state.size);

  const { cardTexture, bandTexture } = useMemo(
    () => ({ cardTexture: createCardTexture(), bandTexture: createBandTexture() }),
    [],
  );

  useEffect(() => {
    void repaintWithWebFont(cardTexture, bandTexture);
    return () => {
      cardTexture.dispose();
      bandTexture.dispose();
    };
  }, [cardTexture, bandTexture]);

  // Scratch vectors and the strap curve, allocated once. `useFrame` runs sixty
  // times a second and must not allocate.
  const scratch = useMemo(
    () => ({
      pointer: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      angular: new THREE.Vector3(),
      rotation: new THREE.Vector3(),
      origin: new THREE.Vector3(),
      followJ1: new THREE.Vector3(),
      followJ2: new THREE.Vector3(),
    }),
    [],
  );
  const curve = useMemo(() => {
    const value = new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    value.curveType = "chordal";
    return value;
  }, []);
  const following = useRef(false);

  // The two segments whose drawn position trails their physics position.
  const smoothed = useMemo(
    () =>
      [
        [j1, scratch.followJ1],
        [j2, scratch.followJ2],
      ] as const,
    [scratch],
  );

  // MeshLineMaterial's constructor demands a resolution, but the real one
  // arrives as a prop below. Memoised because a fresh args array would have
  // react-three-fiber rebuild the material on every render.
  const strapArgs = useMemo<[MeshLineMaterialParameters]>(
    () => [{ resolution: new THREE.Vector2(1, 1) }],
    [],
  );

  // The printed face rides on its own plane rather than on the model's own UVs,
  // which map the card to an arbitrary corner of the texture. Measuring the
  // geometry means the artwork lines up exactly whatever badge is loaded.
  const face = useMemo(() => {
    const geometry = nodes.card.geometry;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new THREE.Box3();
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    return {
      size: [size.x, size.y] as [number, number],
      // A hair proud of the card so it never fights the surface for depth.
      position: [center.x, center.y, box.max.z + size.z * 0.06] as [
        number,
        number,
        number,
      ],
    };
  }, [nodes]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = grab ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, grab]);

  useFrame((state, delta) => {
    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current) {
      return;
    }

    if (grab) {
      // Unproject the pointer onto the plane the card is already on, so it
      // tracks the cursor exactly rather than drifting with perspective.
      scratch.pointer
        .set(state.pointer.x, state.pointer.y, 0.5)
        .unproject(state.camera);
      scratch.direction
        .copy(scratch.pointer)
        .sub(state.camera.position)
        .normalize();
      scratch.pointer.add(
        scratch.direction.multiplyScalar(state.camera.position.length()),
      );

      for (const body of [card, j1, j2, j3, fixed]) body.current?.wakeUp();
      card.current.setNextKinematicTranslation({
        x: scratch.pointer.x - grab.x,
        y: scratch.pointer.y - grab.y,
        z: scratch.pointer.z - grab.z,
      });
    }

    if (!following.current) {
      for (const [body, follow] of smoothed) {
        follow.copy(body.current.translation());
      }
      following.current = true;
    }

    for (const [body, follow] of smoothed) {
      const target = body.current.translation() as THREE.Vector3;
      const distance = Math.max(0.1, Math.min(1, follow.distanceTo(target)));
      // Capped at 1. A slow frame — a software renderer, a backgrounded tab —
      // makes `delta * speed` exceed 1, and a lerp past its target overshoots,
      // then overshoots further next frame, until the strap is out at 1e26 and
      // never comes back.
      const alpha = Math.min(
        1,
        delta * (MIN_FOLLOW + distance * (MAX_FOLLOW - MIN_FOLLOW)),
      );
      follow.lerp(target, alpha);
    }

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(scratch.followJ2);
    curve.points[2].copy(scratch.followJ1);
    curve.points[3].copy(fixed.current.translation());
    strap.current?.setPoints(curve.getPoints(32));

    // Bleed off spin around Y so the card drifts back to facing the camera
    // instead of turning edge-on and disappearing.
    scratch.angular.copy(card.current.angvel() as THREE.Vector3);
    scratch.rotation.copy(card.current.rotation() as unknown as THREE.Vector3);
    card.current.setAngvel(
      {
        x: scratch.angular.x,
        y: scratch.angular.y - scratch.rotation.y * 0.25,
        z: scratch.angular.z,
      },
      true,
    );
  });

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...SEGMENT} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...SEGMENT}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...SEGMENT}
          type={grab ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(event: ThreeEvent<PointerEvent>) => {
              (event.target as Element)?.releasePointerCapture?.(event.pointerId);
              setGrab(null);
            }}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              (event.target as Element)?.setPointerCapture?.(event.pointerId);
              setGrab(
                new THREE.Vector3()
                  .copy(event.point)
                  .sub(scratch.origin.copy(card.current.translation())),
              );
            }}
          >
            {/* The blank card: a dark laminated slab that frames the print. */}
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                color="#0a080d"
                clearcoat={1}
                clearcoatRoughness={0.12}
                roughness={0.45}
                metalness={0.1}
              />
            </mesh>
            <mesh position={face.position}>
              <planeGeometry args={face.size} />
              <meshPhysicalMaterial
                map={cardTexture}
                transparent
                clearcoat={1}
                clearcoatRoughness={0.18}
                roughness={0.5}
                metalness={0}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>

      <mesh>
        <meshLineGeometry ref={strap} />
        <meshLineMaterial
          args={strapArgs}
          color="white"
          depthTest={false}
          resolution={[width, height]}
          useMap={1}
          map={bandTexture}
          repeat={[-4, 1]}
          lineWidth={0.9}
        />
      </mesh>
    </>
  );
}

/** How much room the card and its strap need, in world units. */
const CARD_FRAME = { width: 2.7, height: 3.7 };

/**
 * Pulls the camera back only as far as the frame needs.
 *
 * The card is a fixed size in world units, so a tall narrow column and a short
 * wide one would otherwise show it at wildly different sizes. Solving for the
 * dimension that runs out first keeps it filling roughly the same share of the
 * frame at every shape.
 */
function FramingCamera() {
  const camera = useThree((state) => state.camera);
  const { width, height } = useThree((state) => state.size);

  useEffect(() => {
    const aspect = width / Math.max(height, 1);
    // 0.4434 = 2 · tan(25° / 2): world units visible per unit of distance.
    const forHeight = CARD_FRAME.height / 0.4434;
    const forWidth = CARD_FRAME.width / (0.4434 * aspect);
    camera.position.setZ(THREE.MathUtils.clamp(Math.max(forHeight, forWidth), 8, 20));
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  return null;
}

/**
 * The hanging invite. Purely decorative to assistive tech — every word printed
 * on the card is also on the page as real text.
 */
export default function InviteLanyard() {
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 25 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      // Vertical scrolling still belongs to the page; a sideways drag swings
      // the card.
      style={{ touchAction: "pan-y" }}
      aria-hidden
    >
      <FramingCamera />
      <ambientLight intensity={Math.PI * 0.9} />
      <Suspense fallback={null}>
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Lanyard />
        </Physics>
        <Environment blur={0.75}>
          <color attach="background" args={["black"]} />
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Suspense>
    </Canvas>
  );
}
