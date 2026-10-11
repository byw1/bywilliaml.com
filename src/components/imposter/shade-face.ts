/**
 * Shade's face, as data.
 *
 * Pure shapes on the 120-unit art grid, so the same drawing feeds the app
 * (Mascot.tsx turns them into react-native-svg elements) and the static SVG
 * files in the design system (spec/generate-mascot.js writes them out). Change
 * a face here and both stay in step.
 *
 * No glasses. What makes Shade shady is the eyes: heavy, half-shut lids and a
 * sideways look, as if it knows something you don't. Except it doesn't: the
 * card on its forehead is a question mark.
 */

export type MascotMood = 'smirk' | 'peek' | 'excited' | 'gasp' | 'caught' | 'sleepy' | 'wink';

export const MASCOT_MOODS: readonly MascotMood[] = ['smirk', 'peek', 'excited', 'gasp', 'caught', 'sleepy', 'wink'];

export type Part =
  | { tag: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; stroke?: string; strokeWidth?: number; opacity?: number }
  | { tag: 'circle'; cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }
  | { tag: 'path'; d: string; fill: string; stroke?: string; strokeWidth?: number };

export const SHADE = {
  ink: '#0C0A10',
  head: '#FF4560',
  cheek: '#FFB0BF',
  card: '#C8FF2E',
  sweat: '#9FD8FF',
} as const;

const EYES = [44, 76] as const;
const EYE_Y = 82;

const stroke = (d: string, width = 4): Part => ({ tag: 'path', d, fill: 'none', stroke: SHADE.ink, strokeWidth: width });

/** A closed eye: a soft downward curve. */
const shut = (cx: number): Part => stroke(`M${cx - 7} ${EYE_Y} Q${cx} ${EYE_Y + 5} ${cx + 7} ${EYE_Y}`);

/** A happy closed eye: an upside-down U. */
const happy = (cx: number): Part => stroke(`M${cx - 7} ${EYE_Y + 2} Q${cx} ${EYE_Y - 8} ${cx + 7} ${EYE_Y + 2}`);

/**
 * The sly eye: an ink eye with a heavy lid drawn down over its top, the lid
 * line tipping toward the nose. `lid` is how far down the lid sits, and `dx`
 * where the eye is looking.
 */
function lidded(cx: number, side: -1 | 1, lid: number, dx: number): Part[] {
  const x = cx + dx;
  const rx = 6.8;
  const ry = 8.6;
  // The lid is lower at the inner corner: a smug, knowing look.
  const outer = EYE_Y - 2 + lid;
  const inner = EYE_Y + lid;
  const yLeft = side < 0 ? outer : inner;
  const yRight = side < 0 ? inner : outer;
  // Where the lid line crosses the eye, each side.
  const half = (y: number) => rx * Math.sqrt(Math.max(0, 1 - ((y - EYE_Y) / ry) ** 2));
  const xl = (x - half(yLeft)).toFixed(2);
  const xr = (x + half(yRight)).toFixed(2);
  const large = (yLeft + yRight) / 2 < EYE_Y ? 1 : 0;
  return [
    // The eye below the lid: the lid line, then the bottom of the eye.
    { tag: 'path', d: `M${xl} ${yLeft} L${xr} ${yRight} A${rx} ${ry} 0 ${large} 1 ${xl} ${yLeft} Z`, fill: SHADE.ink },
    { tag: 'circle', cx: x + 2.2, cy: EYE_Y + 3.6, r: 2.1, fill: '#FFFFFF' },
    stroke(`M${cx - 8} ${yLeft} L${cx + 8} ${yRight}`, 3.6),
  ];
}

/** A wide-open eye, with sparkles. */
function open(cx: number, ry: number, at: { x: number; y: number }): Part[] {
  return [
    { tag: 'ellipse', cx: cx + at.x, cy: EYE_Y - 1 + at.y, rx: 7.4, ry, fill: SHADE.ink },
    { tag: 'circle', cx: cx + 2.6 + at.x, cy: EYE_Y - 5.5 + at.y, r: 3, fill: '#FFFFFF' },
    { tag: 'circle', cx: cx - 2.4 + at.x, cy: EYE_Y + 3.5 + at.y, r: 1.4, fill: '#FFFFFF' },
  ];
}

/**
 * The eyes and brows for a mood. `look` is -1, 0 or 1 (left, ahead, right);
 * `blinking` closes them for a beat.
 */
export function eyeParts(mood: MascotMood, look = 0, blinking = false): Part[] {
  const [l, r] = EYES;
  if (mood === 'sleepy') return [shut(l), shut(r)];
  if (mood === 'excited') return [happy(l), happy(r)];
  if (blinking) return mood === 'wink' ? [shut(l), stroke(`M${r - 7} ${EYE_Y + 1} Q${r} ${EYE_Y - 6} ${r + 7} ${EYE_Y + 1}`)] : [shut(l), shut(r)];

  switch (mood) {
    case 'smirk': {
      // A sideways look: off to the right unless glancing somewhere.
      const dx = look === 0 ? 2.2 : look * 2.6;
      return [...lidded(l, -1, 0, dx), ...lidded(r, 1, 0, dx)];
    }
    case 'peek': {
      // Lids lower, eyes darting: shifty.
      const dx = (look === 0 ? 1 : look) * 3;
      return [...lidded(l, -1, 2.5, dx), ...lidded(r, 1, 2.5, dx)];
    }
    case 'wink':
      return [...lidded(l, -1, 0, 1.5), stroke(`M${r - 7} ${EYE_Y + 1} Q${r} ${EYE_Y - 6} ${r + 7} ${EYE_Y + 1}`)];
    case 'gasp':
      return [...open(l, 10.5, { x: 0, y: 0 }), ...open(r, 10.5, { x: 0, y: 0 })];
    case 'caught':
      // Wide eyes glancing up, worried brows, a bead of sweat.
      return [
        stroke(`M${l - 9} 69 L${l + 6} 65`, 3.4),
        stroke(`M${r + 9} 69 L${r - 6} 65`, 3.4),
        ...open(l, 9.5, { x: -1.5, y: 1 }),
        ...open(r, 9.5, { x: -1.5, y: 1 }),
        { tag: 'path', d: 'M97 56 Q92 64 94.5 67.5 Q97 71 99.5 67.5 Q102 64 97 56 Z', fill: SHADE.sweat, stroke: SHADE.ink, strokeWidth: 2.4 },
      ];
  }
}

/** The mouth for a mood. */
export function mouthParts(mood: MascotMood): Part[] {
  switch (mood) {
    case 'excited':
      return [
        { tag: 'path', d: 'M50 96 Q60 110 70 96 Z', fill: SHADE.ink, stroke: SHADE.ink, strokeWidth: 2.5 },
        { tag: 'ellipse', cx: 60, cy: 103.5, rx: 5, ry: 3, fill: SHADE.cheek },
      ];
    case 'gasp':
      return [{ tag: 'ellipse', cx: 60, cy: 101, rx: 4.5, ry: 5.5, fill: SHADE.ink }];
    case 'caught':
      return [stroke('M53 104 Q60 99 67 104', 3.5)];
    case 'peek':
      return [stroke('M54 102 L66 101', 3.5)];
    case 'sleepy':
      return [{ tag: 'ellipse', cx: 60, cy: 100, rx: 3, ry: 3.5, fill: SHADE.ink }];
    case 'smirk':
    case 'wink':
      // A lopsided smirk, up on one side.
      return [stroke('M51 100 Q60 105 69 97', 3.5)];
  }
}

/** The head: sticker border, red ball, belly light, shine and cheeks. */
export function headParts(): Part[] {
  return [
    { tag: 'ellipse', cx: 60, cy: 73, rx: 42, ry: 39, fill: SHADE.head, stroke: SHADE.ink, strokeWidth: 3.5 },
    { tag: 'ellipse', cx: 60, cy: 86, rx: 30, ry: 20, fill: '#FFFFFF', opacity: 0.08 },
    { tag: 'ellipse', cx: 30, cy: 95, rx: 8, ry: 5, fill: SHADE.cheek, opacity: 0.9 },
    { tag: 'ellipse', cx: 90, cy: 95, rx: 8, ry: 5, fill: SHADE.cheek, opacity: 0.9 },
  ];
}
