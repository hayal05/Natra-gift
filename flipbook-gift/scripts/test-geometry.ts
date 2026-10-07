// Manual check for the fold maths. Run: node --experimental-strip-types scripts/test-geometry.ts
import { clampDragPoint, computeFold } from "../src/engine/geometry.ts";
import type { Pt } from "../src/engine/types.ts";

const W = 300, H = 400;
let fails = 0;
const ok = (name: string, cond: boolean) => { console.log((cond ? "PASS " : "FAIL ") + name); if (!cond) fails++; };
const area = (p: Pt[]) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);
const near = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;

ok("no fold when finger is on corner", computeFold([W, H], [W, H], W, H) === null);

const g = computeFold([W, H], [W - 120, H - 80], W, H)!;
ok("lifted + flat areas sum to the page", near(area(g.liftedPoly) + area(g.flatPoly), W * H, 1e-3));
ok("mirrored back has the same area as the lifted part", near(area(g.backPoly), area(g.liftedPoly), 1e-3));
ok("normal is unit length", near(Math.hypot(...g.normal), 1));

// The grabbed corner must land exactly on the finger when mirrored.
const [a, b, c, d, e, f] = g.mirror;
const mc: Pt = [a * W + c * H + e, b * W + d * H + f];
ok("mirror maps corner onto finger", near(mc[0], W - 120, 1e-6) && near(mc[1], H - 80, 1e-6));

// Mirroring twice is the identity.
const m2: Pt = [a * mc[0] + c * mc[1] + e, b * mc[0] + d * mc[1] + f];
ok("mirror is an involution", near(m2[0], W, 1e-6) && near(m2[1], H, 1e-6));

const far = clampDragPoint([W, H], [-5000, -5000], W, H);
ok("clamp keeps finger within one page width of spine", Math.hypot(far[0] - 0, far[1] - H) <= W + 1e-6);
const near2 = clampDragPoint([W, H], [W - 50, H - 50], W, H);
ok("clamp leaves reachable points alone", near2[0] === W - 50 && near2[1] === H - 50);

const gl = computeFold([0, 0], [140, 90], W, H)!;
ok("left/top corner also folds", gl.liftedPoly.length >= 3 && gl.flatPoly.length >= 3);

process.exit(fails ? 1 : 0);
