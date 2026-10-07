import type { FoldGeometry, Pt } from "./types";

export interface ShadingOptions {
  backColor: string;
  /** How strongly the front shows through on the reverse side, 0 to 1. */
  showThrough: number;
}

export function tracePath(ctx: CanvasRenderingContext2D, poly: Pt[]) {
  ctx.beginPath();
  poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}

/**
 * Shadow the lifted paper casts on the page underneath: darkest at the fold line,
 * fading toward the corner. Draw this on the revealed page, clipped to the lifted area.
 */
export function drawCastShadow(ctx: CanvasRenderingContext2D, geo: FoldGeometry, w: number, h: number) {
  const { mid, normal, liftedPoly } = geo;
  const reach = w * 0.2;
  ctx.save();
  tracePath(ctx, liftedPoly);
  ctx.clip();
  const g = ctx.createLinearGradient(mid[0], mid[1], mid[0] + normal[0] * reach, mid[1] + normal[1] * reach);
  g.addColorStop(0, "rgba(0,0,0,.4)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Reverse side of the lifted paper: a soft drop shadow onto the pages below, the paper itself,
 * a faint mirrored show-through of the front, and a highlight/shade sweep that makes the
 * curl read as a bend. Draw after the flat front.
 */
export function drawBackSide(
  ctx: CanvasRenderingContext2D,
  geo: FoldGeometry,
  front: CanvasImageSource,
  w: number,
  h: number,
  opts: ShadingOptions,
) {
  const { mid, normal, backPoly, mirror } = geo;
  const [nx, ny] = normal;

  // Paper plus the shadow it throws on whatever lies beneath (pushed away from the fold).
  ctx.save();
  tracePath(ctx, backPoly);
  ctx.shadowColor = "rgba(0,0,0,.45)";
  ctx.shadowBlur = w * 0.065;
  ctx.shadowOffsetX = -nx * w * 0.015;
  ctx.shadowOffsetY = -ny * w * 0.015;
  ctx.fillStyle = opts.backColor;
  ctx.fill();
  ctx.restore();

  // Show-through of the front, mirrored.
  if (opts.showThrough > 0) {
    ctx.save();
    tracePath(ctx, backPoly);
    ctx.clip();
    ctx.transform(...mirror);
    ctx.globalAlpha = opts.showThrough;
    ctx.drawImage(front, 0, 0, w, h);
    ctx.restore();
  }

  // Curl lighting: dark right at the crease, a bright band, then fade out toward the corner.
  ctx.save();
  tracePath(ctx, backPoly);
  ctx.clip();
  const reach = w * 0.47;
  const g = ctx.createLinearGradient(mid[0], mid[1], mid[0] - nx * reach, mid[1] - ny * reach);
  g.addColorStop(0, "rgba(0,0,0,.3)");
  g.addColorStop(0.35, "rgba(255,255,255,.22)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
