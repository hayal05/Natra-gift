import type { FoldGeometry, Pt } from "./types";

/** Keep the part of a convex polygon where side * ((p - mid) . n) >= 0 (Sutherland-Hodgman, one plane). */
export function clipPolygon(poly: Pt[], mid: Pt, n: Pt, side: 1 | -1): Pt[] {
  const f = (p: Pt) => side * ((p[0] - mid[0]) * n[0] + (p[1] - mid[1]) * n[1]);
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/**
 * Limit where the finger can pull the corner so the paper stays physically plausible:
 * the lifted corner stays within one page width of the spine at the same height, and
 * within one page diagonal of the spine at the opposite height.
 */
export function clampDragPoint(corner: Pt, p: Pt, w: number, h: number): Pt {
  const [cx, cy] = corner;
  const ax = w - cx; // spine x
  let x = p[0];
  let y = p[1];

  let dx = x - ax;
  let dy = y - cy;
  let d = Math.hypot(dx, dy);
  if (d > w) {
    x = ax + (dx * w) / d;
    y = cy + (dy * w) / d;
  }

  const oy = h - cy; // spine point at the opposite height
  const diag = Math.hypot(w, h);
  dx = x - ax;
  dy = y - oy;
  d = Math.hypot(dx, dy);
  if (d > diag) {
    x = ax + (dx * diag) / d;
    y = oy + (dy * diag) / d;
  }
  return [x, y];
}

/**
 * Fold geometry for a page of size w x h whose corner `corner` has been dragged to `point`.
 * Returns null when the finger is (almost) still on the corner, i.e. no visible fold.
 */
export function computeFold(corner: Pt, point: Pt, w: number, h: number): FoldGeometry | null {
  let nx = corner[0] - point[0];
  let ny = corner[1] - point[1];
  const len = Math.hypot(nx, ny);
  if (len < 2) return null;
  nx /= len;
  ny /= len;

  const mid: Pt = [(corner[0] + point[0]) / 2, (corner[1] + point[1]) / 2];
  const normal: Pt = [nx, ny];
  const page: Pt[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];

  const liftedPoly = clipPolygon(page, mid, normal, 1);
  const flatPoly = clipPolygon(page, mid, normal, -1);

  const backPoly = liftedPoly.map((p): Pt => {
    const d = (p[0] - mid[0]) * nx + (p[1] - mid[1]) * ny;
    return [p[0] - 2 * d * nx, p[1] - 2 * d * ny];
  });

  const d0 = nx * mid[0] + ny * mid[1];
  const mirror: FoldGeometry["mirror"] = [
    1 - 2 * nx * nx,
    -2 * nx * ny,
    -2 * nx * ny,
    1 - 2 * ny * ny,
    2 * d0 * nx,
    2 * d0 * ny,
  ];

  return { mid, normal, liftedPoly, flatPoly, backPoly, mirror };
}
