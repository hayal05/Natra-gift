// Sample photos (task 2.4): six illustrated scenes drawn in code in the theme's own colours, so a template looks
// finished before anyone uploads a picture. A photo slot with src "sample:1" to "sample:6" is drawn by
// drawSample(); nothing is downloaded, so it works at any size, follows palette swaps and needs no files in the
// offline export. Deterministic: the same number and palette always give the same picture.
import type { Palette } from "./types";

export const SAMPLE_COUNT = 6;
export const isSample = (src: string | undefined): src is string => !!src && /^sample:[1-9]\d*$/.test(src);
export const sampleNumber = (src: string) => Number(src.slice(7));

/** "#rrggbb" + alpha -> rgba(). Palette colours are always 6-digit hex. */
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Small seeded random generator (mulberry32), so scenes never change between frames. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sky(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, top: string, bottom: string) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
}

function disc(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
}

/** A soft wavy ridge filling from `base` (fraction of height) down to the bottom edge. */
function ridge(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: number, amp: number, freq: number, phase: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(x, y + h);
  for (let i = 0; i <= 24; i++) c.lineTo(x + (w * i) / 24, y + h * (base + amp * Math.sin(i * freq + phase)));
  c.lineTo(x + w, y + h);
  c.closePath();
  c.fill();
}

function heart(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(cx, cy + s * 0.9);
  c.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.7, cy - s * 1.1, cx, cy - s * 0.4);
  c.bezierCurveTo(cx + s * 0.7, cy - s * 1.1, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.9);
  c.fill();
}

/**
 * Draw sample picture `n` (1 to 6, higher numbers wrap) filling the box x,y,w,h.
 * `zoom` (1 to 3) and `panX`/`panY` (-1 to 1) behave like they do for real photos.
 */
export function drawSample(c: CanvasRenderingContext2D, pal: Palette, n: number, x: number, y: number, w: number, h: number, zoom = 1, panX = 0, panY = 0) {
  const k = ((n - 1) % SAMPLE_COUNT) + 1;
  const m = Math.min(w, h);
  const rnd = rng(k * 7919);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  if (zoom > 1) {
    // Zoom about the centre, then shift by up to the overflow on each side (same feel as a real photo).
    c.translate(x + w / 2 - panX * (zoom - 1) * w * 0.5, y + h / 2 - panY * (zoom - 1) * h * 0.5);
    c.scale(zoom, zoom);
    c.translate(-(x + w / 2), -(y + h / 2));
  }

  if (k === 1) {
    // Hills at sunset.
    sky(c, x, y, w, h, pal.soft, pal.accent2);
    disc(c, x + w * 0.68, y + h * 0.42, m * 0.13, "rgba(255,255,255,.85)");
    [[0.6, 0.05, 0.6, 0.0, 0.22], [0.7, 0.06, 0.5, 1.7, 0.36], [0.8, 0.05, 0.7, 3.1, 0.55]].forEach(([b, a, f, p, al]) =>
      ridge(c, x, y, w, h, b, a, f, p, rgba(pal.dark, al)));
  } else if (k === 2) {
    // Mountains under a moon.
    sky(c, x, y, w, h, pal.dark, pal.accent);
    disc(c, x + w * 0.3, y + h * 0.25, m * 0.09, rgba(pal.soft, 0.95));
    for (const [layer, base, al] of [[0, 0.62, 0.35], [1, 0.74, 0.6], [2, 0.86, 0.9]] as const) {
      c.fillStyle = rgba(pal.dark, al);
      c.beginPath();
      c.moveTo(x, y + h);
      const peaks = 3 + layer;
      for (let i = 0; i <= peaks; i++) {
        const px = x + (w * i) / peaks;
        c.lineTo(px, y + h * (base - 0.12 * (0.5 + rnd())));
        c.lineTo(px + w / peaks / 2, y + h * (base + 0.04));
      }
      c.lineTo(x + w, y + h);
      c.closePath();
      c.fill();
    }
  } else if (k === 3) {
    // Sea with the sun on the horizon.
    const hz = 0.58;
    sky(c, x, y, w, h * hz, pal.accent2, pal.soft);
    const sea = c.createLinearGradient(0, y + h * hz, 0, y + h);
    sea.addColorStop(0, pal.accent);
    sea.addColorStop(1, pal.dark);
    c.fillStyle = sea;
    c.fillRect(x, y + h * hz, w, h * (1 - hz));
    disc(c, x + w * 0.5, y + h * hz - m * 0.02, m * 0.14, "rgba(255,255,255,.9)");
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      const sw = m * (0.22 - 0.16 * t) * (0.7 + 0.6 * rnd());
      c.fillStyle = `rgba(255,255,255,${0.5 - 0.35 * t})`;
      c.fillRect(x + w * 0.5 - sw / 2, y + h * (hz + 0.03 + 0.37 * t * t), sw, Math.max(1, h * 0.008));
    }
  } else if (k === 4) {
    // City skyline at dusk.
    sky(c, x, y, w, h, pal.dark, pal.accent);
    disc(c, x + w * 0.72, y + h * 0.22, m * 0.08, rgba(pal.soft, 0.95));
    for (let i = 0; i < 30; i++) disc(c, x + w * rnd(), y + h * 0.4 * rnd(), Math.max(0.6, m * 0.004), "rgba(255,255,255,.6)");
    const cols = 9;
    for (let i = 0; i < cols; i++) {
      const bw = (w / cols) * (0.9 + 0.2 * rnd());
      const bx = x + (w * i) / cols;
      const bh = h * (0.18 + 0.32 * rnd());
      c.fillStyle = rgba(pal.dark, 0.92);
      c.fillRect(bx, y + h - bh, bw, bh);
      for (let wy = y + h - bh + bw * 0.2; wy < y + h - bw * 0.25; wy += bw * 0.3)
        for (let wx = bx + bw * 0.18; wx < bx + bw * 0.78; wx += bw * 0.26)
          if (rnd() > 0.45) { c.fillStyle = rgba(pal.accent2, 0.9); c.fillRect(wx, wy, bw * 0.12, bw * 0.14); }
    }
  } else if (k === 5) {
    // Dunes under a low sun.
    sky(c, x, y, w, h, pal.accent, pal.accent2);
    disc(c, x + w * 0.35, y + h * 0.52, m * 0.2, rgba(pal.soft, 0.9));
    [[0.62, 0.04, 0.45, 0.5, pal.soft, 0.45], [0.72, 0.05, 0.4, 2.2, pal.accent, 0.55], [0.84, 0.045, 0.5, 4.1, pal.dark, 0.75]].forEach(([b, a, f, p, col, al]) =>
      ridge(c, x, y, w, h, b as number, a as number, f as number, p as number, rgba(col as string, al as number)));
  } else {
    // Bokeh and hearts.
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, pal.accent);
    g.addColorStop(1, pal.dark);
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    for (let i = 0; i < 22; i++)
      disc(c, x + w * rnd(), y + h * rnd(), m * (0.03 + 0.1 * rnd()), rgba(i % 2 ? pal.accent2 : pal.soft, 0.1 + 0.22 * rnd()));
    heart(c, x + w * 0.5, y + h * 0.46, m * 0.2, rgba(pal.soft, 0.92));
    heart(c, x + w * 0.74, y + h * 0.3, m * 0.07, rgba(pal.accent2, 0.9));
    heart(c, x + w * 0.27, y + h * 0.66, m * 0.06, rgba(pal.accent2, 0.8));
  }
  c.restore();
}
