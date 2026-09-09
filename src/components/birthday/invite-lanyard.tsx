"use client";

import * as THREE from "three";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
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
import { ConfettiField } from "./confetti-field";

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

/** tan(25° / 2): world units visible per unit of camera distance, halved. */
const TAN_HALF_FOV = 0.2217;

/** Tailwind's `lg`, where the page stops stacking and puts the copy on the left. */
const STACK_BREAKPOINT = 1024;

/**
 * Where the strap is pinned and how far back the camera sits.
 *
 * The scene spans the whole viewport now rather than a column sized to fit it,
 * so both have to be derived rather than fixed. A stacked layout hangs the
 * badge high and centred with the copy beneath it; a wide one moves it over the
 * right-hand third, clear of the headline. The camera then backs off only as
 * far as whichever axis runs out first, which keeps the badge about the same
 * share of the frame on a phone and on a desktop.
 */
function rigFor(width: number, height: number) {
  const aspect = width / Math.max(height, 1);
  const stacked = width < STACK_BREAKPOINT;
  const anchor: [number, number, number] = stacked
    ? [0, 6, 0]
    : [Math.min(2.6, 0.85 + aspect * 0.78), 4.3, 0];

  // Half-extents the rig needs to sit inside, with clearance. Stacked layouts
  // ask for more width than the badge strictly needs, which is what shrinks it
  // enough to leave the copy below it a clear gap.
  const halfWidth = Math.abs(anchor[0]) + (stacked ? 1.75 : 1.5);
  const halfHeight = 2.7;
  const distance = Math.max(
    halfHeight / TAN_HALF_FOV,
    halfWidth / (TAN_HALF_FOV * aspect),
  );

  return { anchor, distance: THREE.MathUtils.clamp(distance, 9, 26) };
}

function useRig() {
  const { width, height } = useThree((state) => state.size);
  return useMemo(() => rigFor(width, height), [width, height]);
}

function Lanyard({ onHeldChange }: { onHeldChange: (held: boolean) => void }) {
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
  const { anchor } = useRig();

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

  const release = (event: ThreeEvent<PointerEvent>) => {
    (event.target as Element)?.releasePointerCapture?.(event.pointerId);
    setGrab(null);
  };

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = grab ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, grab]);

  useEffect(() => {
    const held = Boolean(grab);
    onHeldChange(held);
    if (!held) return;
    // A drag across the page is a drag across live text, and the browser would
    // otherwise read it as a selection and leave half the hero highlighted.
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = "";
    };
  }, [grab, onHeldChange]);

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
      <group position={anchor}>
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
            onPointerUp={release}
            // A touch that turns into a page scroll is cancelled by the
            // browser mid-gesture. Without this the card would stay stuck to a
            // finger that has already moved on.
            onPointerCancel={release}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              // Capture on the element the event actually landed on. The canvas
              // no longer takes pointer events itself, so that is whatever page
              // content sits under the badge.
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

/**
 * Places the camera, and drifts it with the page.
 *
 * The canvas is fixed to the viewport, so without the scroll term the badge
 * would hang in one spot forever while the page slid past it. Moving the camera
 * rather than the rig keeps the physics in an inertial frame: a jerked anchor
 * would set the strap swinging on every scroll.
 */
function CameraRig() {
  const camera = useThree((state) => state.camera);
  const viewportHeight = useThree((state) => state.size.height);
  const { distance } = useRig();
  const drift = useRef(0);

  useEffect(() => {
    camera.position.setZ(distance);
    camera.updateProjectionMatrix();
  }, [camera, distance]);

  useEffect(() => {
    const visibleHeight = 2 * distance * TAN_HALF_FOV;
    const read = () => {
      // Two thirds of the page's own speed: enough separation to read as depth
      // without the badge looking pinned to the glass.
      drift.current =
        (window.scrollY / Math.max(viewportHeight, 1)) * visibleHeight * 0.66;
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [distance, viewportHeight]);

  useFrame(() => {
    camera.position.setY(-drift.current);
    camera.updateMatrixWorld();
  });

  return null;
}

export interface InviteLanyardProps {
  /**
   * The element pointer events are read from. Everything the badge reacts to
   * arrives through here, since the canvas itself is inert.
   */
  eventSource: RefObject<HTMLElement | null>;
  /** Called as the badge is picked up and put down. */
  onHeldChange: (held: boolean) => void;
}

/**
 * The hanging invite, spanning the viewport behind the page.
 *
 * Purely decorative to assistive tech — every word printed on the card is also
 * on the page as real text.
 */
export default function InviteLanyard({
  eventSource,
  onHeldChange,
}: InviteLanyardProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 25 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      // The scene is scenery: it spans the whole viewport behind the page, and
      // taking pointer events here would swallow every click meant for the
      // content on top. Events are read from the page element instead, which
      // leaves links and inputs working while the badge stays draggable.
      // Cast because the ref is genuinely null until the page mounts, which is
      // before this ever renders; the prop type does not allow for that.
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      style={{ pointerEvents: "none" }}
      aria-hidden
    >
      <CameraRig />
      <ambientLight intensity={Math.PI * 0.9} />
      <Suspense fallback={null}>
        <ConfettiField />
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Lanyard onHeldChange={onHeldChange} />
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
