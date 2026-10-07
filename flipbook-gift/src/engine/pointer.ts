import type { CornerSide, Direction } from "./types";

export interface PointerHost {
  /** Current page size in CSS px. */
  size(): { w: number; h: number };
  /** True while an animation runs or the book is not ready: new grabs are ignored. */
  locked(): boolean;
  /** Can a page be turned in this direction (not first/last page)? */
  canTurn(dir: Direction): boolean;
  /** Finger moved: it wants the grabbed corner at (x, y), page-relative CSS px. */
  onDrag(dir: Direction, side: CornerSide, x: number, y: number): void;
  /** Finger lifted or the gesture was cancelled. `x`,`y` is the last wanted corner position. */
  onRelease(dir: Direction, side: CornerSide, x: number, y: number, cancelled: boolean): void;
}

/** Right half grabs the next page, left 30% grabs the previous one. The middle band is inert. */
export function pickDirection(x: number, w: number): Direction | 0 {
  if (x > w * 0.5) return 1;
  if (x < w * 0.3) return -1;
  return 0;
}

/**
 * Wire Pointer Events (touch, mouse, stylus) on the canvas. One pointer at a time, captured so the
 * drag keeps working when the finger leaves the canvas. `touch-action: none` stops the browser
 * from scrolling or zooming while the page is being folded. Returns a detach function.
 */
export function attachPointer(canvas: HTMLCanvasElement, host: PointerHost): () => void {
  canvas.style.touchAction = "none";
  canvas.style.userSelect = "none";
  canvas.style.setProperty("-webkit-user-select", "none");
  canvas.style.setProperty("-webkit-touch-callout", "none");
  canvas.style.cursor = "grab";

  let active: {
    id: number;
    dir: Direction;
    side: CornerSide;
    startX: number;
    startY: number;
    cornerX: number;
    cornerY: number;
    lastX: number;
    lastY: number;
  } | null = null;

  /** Pointer position in page CSS px, robust to the canvas being scaled by CSS. */
  function local(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const { w, h } = host.size();
    return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
  }

  function down(e: PointerEvent) {
    if (active || host.locked() || !e.isPrimary) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const { w, h } = host.size();
    const p = local(e);
    const dir = pickDirection(p.x, w);
    if (!dir || !host.canTurn(dir)) return;

    const side: CornerSide = p.y > h / 2 ? "bottom" : "top";
    const cornerX = dir > 0 ? w : 0;
    const cornerY = side === "bottom" ? h : 0;
    active = { id: e.pointerId, dir, side, startX: p.x, startY: p.y, cornerX, cornerY, lastX: cornerX, lastY: cornerY };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* capture can fail for synthetic events; the drag still works inside the canvas */
    }
    canvas.style.cursor = "grabbing";
    e.preventDefault();
  }

  function move(e: PointerEvent) {
    if (!active || e.pointerId !== active.id) return;
    const p = local(e);
    active.lastX = active.cornerX + (p.x - active.startX);
    active.lastY = active.cornerY + (p.y - active.startY);
    host.onDrag(active.dir, active.side, active.lastX, active.lastY);
    e.preventDefault();
  }

  function end(e: PointerEvent, cancelled: boolean) {
    if (!active || e.pointerId !== active.id) return;
    const a = active;
    active = null;
    canvas.style.cursor = "grab";
    try {
      canvas.releasePointerCapture(a.id);
    } catch {
      /* already released */
    }
    host.onRelease(a.dir, a.side, a.lastX, a.lastY, cancelled);
  }

  const up = (e: PointerEvent) => end(e, false);
  const cancel = (e: PointerEvent) => end(e, true);
  const noMenu = (e: Event) => e.preventDefault(); // long-press menu on touch devices

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("contextmenu", noMenu);

  return () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", cancel);
    canvas.removeEventListener("contextmenu", noMenu);
    active = null;
  };
}
