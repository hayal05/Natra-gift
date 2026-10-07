import { clampDragPoint, computeFold } from "./geometry";
import { attachPointer } from "./pointer";
import { drawBackSide, drawCastShadow, tracePath } from "./shading";
import { createUi, type EngineState } from "./ui";
import type { CornerSide, Direction, Flipbook, FlipbookOptions, PageDrawFn, PageSource, Pt } from "./types";

interface FoldState {
  dir: Direction;
  corner: Pt;
  point: Pt;
}

const TURN_MS = 750;
const COMPLETE_MS = 420;
const SNAP_BACK_MS = 300;
/** Default for `tuning.completeFraction`: fraction of page width a dragged corner must travel to complete a turn. */
const COMPLETE_FRACTION = 0.38;
/** A container shorter than this (px) is treated as having no definite height. */
const MIN_CONTAIN_HEIGHT = 10;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Wait for promises and unloaded images; throw if a page cannot be loaded. */
async function resolveSource(src: PageSource | Promise<PageSource>): Promise<PageSource> {
  const s = await src;
  if (typeof HTMLImageElement !== "undefined" && s instanceof HTMLImageElement) {
    if (!s.complete) await s.decode();
    if (s.naturalWidth === 0) throw new Error("A page image failed to load");
  }
  return s;
}

/**
 * Flipbook engine: single-page layout that fits its container, re-lays out on resize and on
 * pixel-ratio change, draws sharp on high-DPI screens, shows loading and error states, and has
 * discreet prev/next buttons. Fold drawing is in shading.ts, geometry in geometry.ts, pointer
 * input in pointer.ts, overlay UI in ui.ts.
 */
export function create(container: HTMLElement, options: FlipbookOptions): Flipbook {
  const aspect = options.aspect ?? 3 / 4;
  const backColor = options.backColor ?? "#f4efe6";
  const showThrough = options.showThrough ?? 0.14;
  const maxDpr = options.maxPixelRatio ?? 3;
  const fit = options.fit ?? "width";
  const sources = options.pages;
  const tuning = { completeFraction: COMPLETE_FRACTION };

  // Root holds the canvas, arrows and overlay; the canvas is positioned inside it.
  const root = document.createElement("div");
  root.style.cssText = "position:relative;width:100%;overflow:hidden";
  container.appendChild(root);

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;display:block";
  canvas.setAttribute("role", "img");
  root.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    root.remove();
    throw new Error("Canvas 2D is not available");
  }

  let state: EngineState = "loading";
  let w = 0;
  let h = 0;
  let curDpr = 0;
  let index = 0;
  let fold: FoldState | null = null;
  let raf = 0;
  let busy = false;
  let dragging = false;
  let destroyed = false;
  let pendingLayout = false;
  let resolved: Array<CanvasImageSource | PageDrawFn> = [];
  let bitmaps: CanvasImageSource[] = [];

  const ui = createUi(
    root,
    {
      prev: () => void turn(-1),
      next: () => void turn(1),
      retry: options.onRetry,
    },
    {
      buttons: options.buttons ?? true,
      loadingText: options.loadingText ?? "Loading your gift…",
      errorText: options.errorText ?? "Sorry, this book could not be loaded.",
      retryText: options.retryText ?? "Try again",
    },
  );

  function setError(err: unknown) {
    if (destroyed) return;
    state = "error";
    fold = null;
    bitmaps = [];
    ctx!.clearRect(0, 0, w, h);
    ui.setState("error");
    options.onError?.(err);
  }

  function updateNav() {
    canvas.setAttribute("aria-label", `Page ${index + 1} of ${sources.length}`);
    ui.setNav(index > 0, index < sources.length - 1);
  }

  function rasterize() {
    bitmaps = resolved.map((src, i) => {
      if (typeof src !== "function") return src;
      const off = document.createElement("canvas");
      off.width = Math.round(w * curDpr);
      off.height = Math.round(h * curDpr);
      const c = off.getContext("2d");
      if (!c) throw new Error("Canvas 2D is not available");
      c.scale(curDpr, curDpr);
      src(c, w, h, i);
      return off;
    });
  }

  /**
   * Fit the page into the container. Skipped (and retried when the gesture ends) while a fold is
   * in progress. Re-rasterises pages only when size or pixel ratio actually changed.
   */
  function layout(force = false) {
    if (destroyed) return;
    if (busy || dragging) {
      pendingLayout = true;
      return;
    }
    pendingLayout = false;

    root.style.height = fit === "contain" ? "100%" : "auto";
    const cw = root.clientWidth;
    const ch = root.clientHeight;
    if (cw <= 0) return; // hidden or not laid out yet; the ResizeObserver calls us again
    let nw: number;
    let nh: number;
    let top = 0;
    if (fit === "contain" && ch >= MIN_CONTAIN_HEIGHT) {
      nw = Math.min(cw, ch * aspect);
      nh = Math.round(nw / aspect);
      top = Math.max(0, (ch - nh) / 2);
    } else {
      nw = cw;
      nh = Math.round(nw / aspect);
      root.style.height = nh + "px";
    }
    nw = Math.round(nw);
    const left = Math.max(0, (cw - nw) / 2);
    canvas.style.left = left + "px";
    ui.setInset(left);
    canvas.style.top = top + "px";
    options.onLayout?.({ left, top, width: nw, height: nh });

    const dpr = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, maxDpr);
    if (!force && nw === w && nh === h && dpr === curDpr) return;
    w = nw;
    h = nh;
    curDpr = dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (state === "error") return;
    if (resolved.length) {
      try {
        rasterize();
      } catch (err) {
        setError(err);
        return;
      }
    }
    draw();
  }

  function draw() {
    const c = ctx!;
    c.clearRect(0, 0, w, h);
    if (!bitmaps.length) return;
    const geo = fold ? computeFold(fold.corner, fold.point, w, h) : null;
    if (!fold || !geo) {
      c.drawImage(bitmaps[index], 0, 0, w, h);
      return;
    }

    // 1. The page being revealed underneath, darkened where the lifted paper shades it.
    c.drawImage(bitmaps[index + fold.dir], 0, 0, w, h);
    drawCastShadow(c, geo, w, h);

    // 2. The part of the current page still lying flat.
    c.save();
    tracePath(c, geo.flatPoly);
    c.clip();
    c.drawImage(bitmaps[index], 0, 0, w, h);
    c.restore();

    // 3. The reverse side: paper, drop shadow, mirrored show-through and curl lighting.
    drawBackSide(c, geo, bitmaps[index], w, h, { backColor, showThrough });
  }

  function setFold(dir: Direction, side: CornerSide, x: number, y: number) {
    if (destroyed || index + dir < 0 || index + dir >= bitmaps.length) return;
    const corner: Pt = [dir > 0 ? w : 0, side === "bottom" ? h : 0];
    fold = { dir, corner, point: clampDragPoint(corner, [x, y], w, h) };
    draw();
  }

  function clearFold() {
    fold = null;
    draw();
  }

  /** Where the corner ends up when a turn is complete: just past the spine's far edge. */
  function completeTarget(corner: Pt): Pt {
    return [w - corner[0] + (w - 2 * corner[0]) * 0.98, corner[1]];
  }

  /**
   * Animate the dragged corner from `from` to `to` with easing. `lift` adds a shallow upward arc
   * (programmatic turns only). Resolves when finished, or immediately if destroyed.
   */
  function animateFold(dir: Direction, corner: Pt, from: Pt, to: Pt, ms: number, lift = 0): Promise<void> {
    busy = true;
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        if (destroyed) return resolve();
        const t = Math.min(1, (now - t0) / ms);
        const e = easeOutCubic(t);
        const x = from[0] + (to[0] - from[0]) * e;
        const y = from[1] + (to[1] - from[1]) * e - Math.sin(Math.PI * e) * h * lift;
        fold = { dir, corner, point: clampDragPoint(corner, [x, y], w, h) };
        draw();
        if (t < 1) raf = requestAnimationFrame(step);
        else resolve();
      };
      raf = requestAnimationFrame(step);
    });
  }

  function finishTurn(dir: Direction, completed: boolean) {
    fold = null;
    busy = false;
    if (completed) index += dir;
    if (pendingLayout) layout(true);
    else draw();
    updateNav();
    if (completed) options.onPageChange?.(index);
  }

  /** Programmatic turn: the corner swings across the page along a shallow arc. */
  async function turn(dir: Direction): Promise<boolean> {
    const target = index + dir;
    if (destroyed || state !== "ready" || busy || dragging || target < 0 || target >= bitmaps.length) return false;
    const corner: Pt = [dir > 0 ? w : 0, h];
    await animateFold(dir, corner, corner, completeTarget(corner), TURN_MS, 0.22);
    if (destroyed) return false;
    finishTurn(dir, true);
    return true;
  }

  /** Finger lifted: complete the turn if dragged far enough, otherwise snap back. */
  async function release(dir: Direction, cancelled: boolean) {
    dragging = false;
    if (destroyed) return;
    if (!fold) {
      if (pendingLayout) layout(true); // a tap that never folded anything
      return;
    }
    const corner = fold.corner;
    const from = fold.point;
    const travelled = Math.hypot(from[0] - corner[0], from[1] - corner[1]);
    const completed = !cancelled && travelled > w * tuning.completeFraction;
    await animateFold(dir, corner, from, completed ? completeTarget(corner) : corner, completed ? COMPLETE_MS : SNAP_BACK_MS);
    if (destroyed) return;
    finishTurn(dir, completed);
  }

  const detachPointer = attachPointer(canvas, {
    size: () => ({ w, h }),
    locked: () => destroyed || busy || state !== "ready",
    canTurn: (dir) => index + dir >= 0 && index + dir < bitmaps.length,
    onDrag: (dir, side, x, y) => {
      dragging = true;
      setFold(dir, side, x, y);
    },
    onRelease: (dir, _side, _x, _y, cancelled) => {
      void release(dir, cancelled);
    },
  });

  function onKey(e: KeyboardEvent) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "ArrowRight") void turn(1);
    else if (e.key === "ArrowLeft") void turn(-1);
  }
  if (options.keyboard ?? true) document.addEventListener("keydown", onKey);

  // Re-layout on container resize; devicePixelRatio changes (zoom, moving screens) show up as resizes
  // or are picked up by the next layout. Coalesced to one layout per frame.
  let resizeRaf = 0;
  const scheduleLayout = () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      layout();
    });
  };
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(scheduleLayout) : null;
  observer?.observe(container);
  if (!observer) addEventListener("resize", scheduleLayout);

  layout(true);
  updateNav();

  const ready: Promise<boolean> = (async () => {
    if (!sources.length) {
      setError(new Error("This book has no pages"));
      return false;
    }
    try {
      resolved = await Promise.all(sources.map(resolveSource));
    } catch (err) {
      setError(err);
      return false;
    }
    if (destroyed) return false;
    layout(true);
    if ((state as EngineState) === "error") return false;
    state = "ready";
    ui.setState("ready");
    updateNav();
    return true;
  })();

  return {
    next: () => turn(1),
    prev: () => turn(-1),
    setFold,
    clearFold,
    resize: () => layout(),
    tuning,
    ready,
    get state() {
      return state;
    },
    get index() {
      return index;
    },
    get pageCount() {
      return sources.length;
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      observer?.disconnect();
      removeEventListener("resize", scheduleLayout);
      document.removeEventListener("keydown", onKey);
      detachPointer();
      ui.destroy();
      root.remove();
      bitmaps = [];
      resolved = [];
    },
  };
}
