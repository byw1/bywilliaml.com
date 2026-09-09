import * as THREE from "three";
import { EVENT } from "@/lib/birthday/event";

/**
 * The artwork on the hanging card and on the lanyard is drawn at runtime into
 * 2-D canvases rather than shipped as images. It keeps the invite in one
 * language — change `EVENT` and the card face changes with it — and it means
 * the page carries no art assets at all.
 */

const CARD_WIDTH = 1024;
// The card mesh is a 16:22.5 portrait, so the texture matches to keep the
// lettering from stretching.
const CARD_HEIGHT = 1440;

const BAND_WIDTH = 1024;
const BAND_HEIGHT = 128;

const INK = "#f7f5f2";
const ACCENT = "#f0b357";

/** Poppins is the site face; everything falls back to the system stack. */
function font(weight: number, size: number): string {
  return `${weight} ${size}px Poppins, system-ui, -apple-system, "Segoe UI", sans-serif`;
}

/** Canvas has no letter-spacing before Chrome 99, so tracking is drawn by hand. */
function trackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
): number {
  let cursor = x;
  for (const character of text) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + tracking;
  }
  return cursor - tracking - x;
}

function trackedWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking: number,
): number {
  let total = 0;
  for (const character of text) total += ctx.measureText(character).width + tracking;
  return total - tracking;
}

/** Rounded-rect path, the shape the printed panel is clipped to. */
function panelPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCard(ctx: CanvasRenderingContext2D): void {
  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;

  ctx.clearRect(0, 0, w, h);

  // The texture covers the whole card face, so the print is inset and its
  // corners rounded: everything outside stays transparent and the card's own
  // material shows through as a thin dark bezel.
  const inset = w * 0.045;
  const panelW = w - inset * 2;
  const panelH = h - inset * 2;

  ctx.save();
  panelPath(ctx, inset, inset, panelW, panelH, w * 0.055);
  ctx.clip();

  const base = ctx.createLinearGradient(0, 0, w * 0.4, h);
  base.addColorStop(0, "#1d1726");
  base.addColorStop(0.55, "#120e18");
  base.addColorStop(1, "#0b0910");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // A warm bloom behind the headline, so the card reads as lit rather than flat.
  const glow = ctx.createRadialGradient(w * 0.15, h * 0.28, 0, w * 0.15, h * 0.28, w);
  glow.addColorStop(0, "rgba(240, 179, 87, 0.28)");
  glow.addColorStop(0.5, "rgba(240, 179, 87, 0.07)");
  glow.addColorStop(1, "rgba(240, 179, 87, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const pad = w * 0.115;
  const right = w - pad;

  // The card is punched for the clip, so nothing is printed in the top eighth.
  const top = h * 0.175;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = ACCENT;
  ctx.font = font(600, 32);
  trackedText(ctx, "YOU'RE INVITED", pad, top, 10);

  ctx.fillStyle = INK;
  ctx.font = font(600, 116);
  ctx.fillText(`${EVENT.host}'s`, pad - 6, top + 152);
  ctx.font = font(200, 116);
  ctx.fillText("birthday", pad - 6, top + 268);

  ctx.strokeStyle = "rgba(247, 245, 242, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, top + 342);
  ctx.lineTo(right, top + 342);
  ctx.stroke();

  const rows: Array<[string, string]> = [
    ["WHEN", `${EVENT.shortDateLabel} · ${EVENT.yearLabel}`],
    ["TIME", `${EVENT.timeLabel} ${EVENT.timeZoneLabel}`],
    ["WHERE", EVENT.placeLabel.toUpperCase()],
  ];
  rows.forEach(([label, value], index) => {
    const y = top + 414 + index * 104;
    ctx.fillStyle = "rgba(247, 245, 242, 0.42)";
    ctx.font = font(500, 24);
    trackedText(ctx, label, pad, y, 7);
    ctx.fillStyle = INK;
    ctx.font = font(500, 48);
    ctx.fillText(value, pad, y + 54);
  });

  // A pass stub along the bottom: dashed tear line, "admit one", and bars.
  const stub = h - inset - 268;
  ctx.strokeStyle = "rgba(247, 245, 242, 0.24)";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 14]);
  ctx.beginPath();
  ctx.moveTo(pad, stub);
  ctx.lineTo(right, stub);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = ACCENT;
  ctx.font = font(600, 30);
  trackedText(ctx, "ADMIT ONE", pad, stub + 74, 9);

  ctx.fillStyle = "rgba(247, 245, 242, 0.4)";
  ctx.font = font(400, 26);
  const site = "bywilliaml.com";
  ctx.fillText(site, right - ctx.measureText(site).width, stub + 74);

  // Decorative bars, spaced from a fixed pattern so the card looks identical
  // on every load.
  const widths = [7, 3, 11, 4, 6, 15, 3, 8, 5, 12, 4, 7, 9, 3, 6, 13, 5, 4, 10, 6];
  let barX = pad;
  ctx.fillStyle = "rgba(247, 245, 242, 0.5)";
  for (let index = 0; barX < right - 18; index += 1) {
    const barWidth = widths[index % widths.length];
    ctx.fillRect(barX, stub + 118, barWidth, 86);
    barX += barWidth + widths[(index + 3) % widths.length] + 6;
  }

  ctx.restore();

  // A hairline highlight along the print edge, the way a laminate catches light.
  ctx.strokeStyle = "rgba(247, 245, 242, 0.14)";
  ctx.lineWidth = 3;
  panelPath(ctx, inset, inset, panelW, panelH, w * 0.055);
  ctx.stroke();
}

function drawBand(ctx: CanvasRenderingContext2D): void {
  const w = BAND_WIDTH;
  const h = BAND_HEIGHT;

  const weave = ctx.createLinearGradient(0, 0, 0, h);
  weave.addColorStop(0, "#1b1620");
  weave.addColorStop(0.5, "#2a222f");
  weave.addColorStop(1, "#15111a");
  ctx.fillStyle = weave;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(240, 179, 87, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(w, 10);
  ctx.moveTo(0, h - 10);
  ctx.lineTo(w, h - 10);
  ctx.stroke();

  // One repeat of the webbing print. The material tiles it along the strap, so
  // the phrases are spaced to divide the canvas exactly — an uneven remainder
  // would show as a chopped word at every seam.
  ctx.textBaseline = "middle";
  ctx.font = font(600, 46);
  const phrase = "HAPPY BIRTHDAY";
  const tracking = 10;
  const phraseWidth = trackedWidth(ctx, phrase, tracking);
  const copies = Math.max(1, Math.round(w / (phraseWidth + 110)));
  const slot = w / copies;

  for (let index = 0; index < copies; index += 1) {
    const start = index * slot + (slot - phraseWidth) / 2;
    ctx.fillStyle = INK;
    trackedText(ctx, phrase, start, h / 2, tracking);
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(index * slot + slot - (slot - phraseWidth) / 4, h / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function paint(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  return canvas;
}

export function createCardTexture(): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(paint(CARD_WIDTH, CARD_HEIGHT, drawCard));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

export function createBandTexture(): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(paint(BAND_WIDTH, BAND_HEIGHT, drawBand));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Repaints both canvases once Poppins has actually arrived.
 *
 * The first paint happens immediately with whatever the system has, because a
 * blank card while a webfont downloads looks broken; this swaps the real face
 * in a frame or two later.
 */
export async function repaintWithWebFont(
  card: THREE.CanvasTexture,
  band: THREE.CanvasTexture,
): Promise<void> {
  if (!("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load('200 124px "Poppins"'),
      document.fonts.load('500 50px "Poppins"'),
      document.fonts.load('600 124px "Poppins"'),
    ]);
    await document.fonts.ready;
  } catch {
    // A font that refuses to load is not worth failing the invite over.
    return;
  }

  for (const [texture, draw] of [
    [card, drawCard],
    [band, drawBand],
  ] as const) {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    draw(ctx);
    texture.needsUpdate = true;
  }
}
