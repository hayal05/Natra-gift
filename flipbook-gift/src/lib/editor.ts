// Pure helpers for the page editor (task 3.2): which slots a creator can select, their names, and tap hit-testing.
// No React here, so it can be checked from the command line (scripts/test-editor.ts).
import { photoSlotRect, slotRect, textSlotRect } from "./pages/render";
import { SAMPLE_COUNT, isSample } from "./pages/sample";
import type { ColorRef, Layout, PageData, Palette, PhotoContent, PhotoFrame, PhotoSlotDef, SlotDef, TextSlotDef, TextStyle } from "./pages/types";

export type EditableSlot = TextSlotDef | PhotoSlotDef;

/** Text and photo slots the creator can change. Shapes, the folio and fixed decorative text (a big quote mark) are not editable. */
export const isEditable = (s: SlotDef): s is EditableSlot =>
  s.kind === "photo" || (s.kind === "text" && !s.auto && s.text === undefined);

export const editableSlots = (l: Layout): EditableSlot[] => l.slots.filter(isEditable);

const TEXT_NAMES: Record<string, string> = {
  kicker: "Small label", title: "Title", body: "Text", body2: "Second text", caption: "Caption", caption2: "Caption 2",
  caption3: "Caption 3", byline: "Cover line", sign: "Signature", quote: "Quote",
};

/** Plain-language name for a slot, for the selection bar and the slot buttons. */
export function slotName(l: Layout, s: EditableSlot): string {
  if (s.kind === "text") return TEXT_NAMES[s.id] ?? s.id;
  const n = l.slots.filter((x) => x.kind === "photo").length;
  return n > 1 ? `Photo ${s.id.slice(1)}` : "Photo";
}

/** What the slot holds right now, in a few words, for the selection bar. */
export function slotSummary(s: EditableSlot, page: PageData): string {
  const v = page.slots[s.id];
  if (s.kind === "photo") return typeof v === "object" && v.src ? (isSample(v.src) ? "Sample photo" : "Your photo") : "No photo yet";
  const t = typeof v === "string" ? v.trim() : "";
  if (!t) return s.hint ?? "Empty";
  return t.length > 60 ? t.slice(0, 57).trimEnd() + "…" : t;
}

/** The editable slot under a point given in page pixels (w x h), topmost first. Rotation is ignored, as in slotAt. */
export function editableAt(l: Layout, page: PageData, w: number, h: number, px: number, py: number, styles?: Record<string, TextStyle>): EditableSlot | null {
  const list = editableSlots(l);
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    const raw = page.slots[s.id];
    const r = s.kind === "text" ? textSlotRect(s, styles?.[s.id], w, h) : photoSlotRect(s, typeof raw === "object" && raw ? raw : undefined, w, h);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return s;
  }
  return null;
}

/**
 * Moves a page to another layout (task 3.3). Content carries over by slot id (p1..p3, title, body, ...).
 * Nothing is deleted: content for slots the new layout does not have stays in `slots` (the renderer ignores it),
 * so swapping back restores it. A photo slot with no photo yet gets a sample photo, so no page is ever bare.
 * The page background, text styles and tokens such as {to} are kept as they are.
 */
export function swapLayout(page: PageData, next: Layout, seed = 0): PageData {
  if (page.layout === next.id) return page;
  const slots = { ...page.slots };
  let k = 0;
  for (const s of next.slots) {
    if (s.kind !== "photo") continue;
    const v = slots[s.id];
    if (!(typeof v === "object" && v.src)) slots[s.id] = { src: `sample:${((seed + k) % SAMPLE_COUNT) + 1}` };
    k++;
  }
  return { ...page, layout: next.id, slots };
}

/** Plain names for the layout groups, in picker order. */
export const GROUP_NAMES: [Layout["group"], string][] = [
  ["cover", "Covers"], ["photo", "Photos"], ["collage", "Collages"], ["text", "Text"], ["quote", "Quotes"], ["closing", "Closings"],
];

// ---------- Text controls (task 3.4) ----------

/** Palette colours a creator can give text, in picker order, with plain names. */
export const TEXT_COLORS: [keyof Palette, string][] = [
  ["ink", "Text"], ["accent", "Accent"], ["accent2", "Accent 2"], ["paper", "Paper"], ["dark", "Dark"],
];

const PAGE_W = 360, PAGE_H = 480; // the editor's logical page; only used to estimate how much text a slot holds

/** Most characters a text slot accepts: about what fits at its normal size (a letter body is about 330, a title about 50).
 *  A one-line slot gets double, because the renderer shrinks such text to fit rather than wrapping it. */
export function textLimit(s: TextSlotDef): number {
  const px = s.size * PAGE_W;
  const lines = Math.max(1, Math.floor((s.h * PAGE_H) / (px * (s.lh ?? 1.3))));
  const perLine = (s.w * PAGE_W) / (px * 0.5);
  return Math.max(24, Math.round(lines * perLine * (lines === 1 ? 2 : 1)));
}

/** Sets the text of a slot on a raw page (cut to the slot's limit). Typed text has no {to}/{from} tokens. */
export function setSlotText(page: PageData, s: TextSlotDef, text: string): PageData {
  return { ...page, slots: { ...page.slots, [s.id]: text.slice(0, textLimit(s)) } };
}

/** Merges a style change into a raw page. A key set to undefined goes back to the layout's own look; an empty style is removed. */
export function setTextPosition(page: PageData, id: string, dx: number, dy: number): PageData {
  const current = page.styles?.[id] ?? {};
  const clamp = (v: number) => Math.max(-0.45, Math.min(0.45, Math.round(v * 1000) / 1000));
  const x = clamp(dx), y = clamp(dy);
  const styles = { ...page.styles, [id]: { ...current, x: x || undefined, y: y || undefined } };
  if (styles[id] && styles[id].x === undefined && styles[id].y === undefined) delete styles[id];
  return { ...page, styles: Object.keys(styles).length ? styles : undefined };
}

export function setTextStyle(page: PageData, id: string, patch: Partial<TextStyle>): PageData {
  const merged: Record<string, unknown> = { ...page.styles?.[id], ...patch };
  for (const k of Object.keys(merged)) if (merged[k] === undefined) delete merged[k];
  const styles = { ...page.styles };
  if (Object.keys(merged).length) styles[id] = merged as TextStyle; else delete styles[id];
  return { ...page, styles: Object.keys(styles).length ? styles : undefined };
}

/** Clears all creator overrides on a text box and restores its layout-defined position and size. */
export function resetTextBox(page: PageData, id: string): PageData {
  const styles = { ...page.styles };
  delete styles[id];
  return { ...page, styles: Object.keys(styles).length ? styles : undefined };
}

// ---------- Photo controls (task 3.5) ----------

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Merges a change into the photo of one slot on a raw page (task 3.5a). A key set to undefined goes back to the default.
 * Values are clamped (zoom 1 to 3, pan -1 to 1) and a value equal to the renderer's default is dropped, so an
 * unadjusted photo stays just `{ src }`. `frame` is the exception: "none" is kept, because a layout may frame its
 * photo by default and "none" is then a real choice; only undefined returns to the layout's own frame.
 * A slot with no photo yet starts from an empty `src` (the placeholder). Never changes `src` unless the patch has one.
 */
export function setPhoto(page: PageData, slotId: string, patch: Partial<PhotoContent>): PageData {
  const cur = page.slots[slotId];
  const m: Partial<PhotoContent> = { src: "", ...(typeof cur === "object" && cur ? cur : {}), ...patch };
  const num = (v: number | undefined, lo: number, hi: number, dflt: number) =>
    typeof v === "number" && Number.isFinite(v) && clamp(v, lo, hi) !== dflt ? clamp(v, lo, hi) : undefined;
  const out: PhotoContent = { src: typeof m.src === "string" ? m.src : "" };
  const pos = (v: number | undefined, lo: number, hi: number) => typeof v === "number" && Number.isFinite(v) ? clamp(v, lo, hi) : undefined;
  const x = pos(m.x, 0, 0.9), y = pos(m.y, 0, 0.9), w = pos(m.w, 0.1, 1), h = pos(m.h, 0.1, 1);
  if (x !== undefined) out.x = x; if (y !== undefined) out.y = y; if (w !== undefined) out.w = w; if (h !== undefined) out.h = h;
  const zoom = num(m.zoom, 1, 3, 1), panX = num(m.panX, -1, 1, 0), panY = num(m.panY, -1, 1, 0);
  if (zoom !== undefined) out.zoom = zoom;
  if (panX !== undefined) out.panX = panX;
  if (panY !== undefined) out.panY = panY;
  if (m.fit === "fit") out.fit = "fit";
  if (m.filter === "warm" || m.filter === "bw") out.filter = m.filter;
  if (m.frame === "none" || m.frame === "border" || m.frame === "rounded") out.frame = m.frame;
  return { ...page, slots: { ...page.slots, [slotId]: out } };
}

export interface Size { w: number; h: number }

/**
 * How far the drawn photo sticks out past its box on each axis, in the box's own units (task 3.5e). Mirrors `drawImageIn`
 * in render.ts: "fill" covers the box, "fit" shows the photo whole, zoom multiplies either. `img` is the decoded picture's
 * size; null means a sample photo (drawn in code), which grows with zoom only, like a photo that already fills the box.
 * Pan only has an effect on an axis with overflow.
 */
export function photoOverflow(box: Size, img: Size | null, p: Pick<PhotoContent, "fit" | "zoom">): { x: number; y: number } {
  const zoom = clamp(p.zoom ?? 1, 1, 3);
  if (!(box.w > 0 && box.h > 0)) return { x: 0, y: 0 };
  if (!img || !(img.w > 0 && img.h > 0)) return { x: (zoom - 1) * box.w, y: (zoom - 1) * box.h };
  const scale = (p.fit === "fit" ? Math.min(box.w / img.w, box.h / img.h) : Math.max(box.w / img.w, box.h / img.h)) * zoom;
  const over = (v: number) => (v > 1e-6 ? v : 0); // float noise on the axis that fits exactly is not overflow
  return { x: over(img.w * scale - box.w), y: over(img.h * scale - box.h) };
}

/**
 * New pan after the finger moves the photo by (dx, dy), in the box's units (task 3.5e). The photo follows the finger, so
 * dragging right shows more of the left side. Pan runs -1 to 1 across HALF the overflow each way (as the renderer draws it).
 * An axis with no overflow keeps its pan unchanged (the photo cannot move that way). Results are clamped and rounded to 3 decimals.
 */
export function panBy(p: Pick<PhotoContent, "panX" | "panY" | "fit" | "zoom">, dx: number, dy: number, box: Size, img: Size | null): { panX: number; panY: number } {
  const o = photoOverflow(box, img, p);
  const axis = (pan: number | undefined, d: number, over: number) =>
    over > 0 && Number.isFinite(d) ? Math.round(clamp((pan ?? 0) - d / (over / 2), -1, 1) * 1000) / 1000 : pan ?? 0;
  return { panX: axis(p.panX, dx, o.x), panY: axis(p.panY, dy, o.y) };
}

/**
 * The area the picture itself is drawn in, inside a photo slot, in page pixels (w x h) (task 3.5f).
 * A border frame leaves a white edge (and a polaroid's bottom mat), so the picture is smaller than the slot. Mirrors `drawPhoto` in render.ts.
 * `frame` is the photo's own choice; undefined means the layout's frame.
 */
export function photoBox(s: PhotoSlotDef, frame: PhotoFrame | undefined, w: number, h: number): Size {
  const r = slotRect(s, w, h);
  const border = (frame ?? s.frame ?? "none") === "border";
  const pad = border ? Math.min(r.w, r.h) * 0.045 : 0;
  const bottom = border ? (s.matBottom ?? 0) * r.h : 0;
  return { w: r.w - pad * 2, h: r.h - pad * 2 - bottom };
}

// ---------- Replace and reset a photo (task 3.5g) ----------

/** Largest photo file accepted. It is shrunk in the browser (task 3.8, src/lib/photo.ts) before it is kept, so this only guards against files too big to decode comfortably. */
export const PHOTO_MAX_BYTES = 15 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Why a picked file cannot be used, in plain words, or null when it is fine. */
export function photoFileProblem(f: { type: string; size: number }): string | null {
  if (!PHOTO_TYPES.includes(f.type)) return "Please choose a JPG, PNG, WebP or GIF photo.";
  if (f.size <= 0) return "That file is empty.";
  if (f.size > PHOTO_MAX_BYTES) return `That photo is too large (${(f.size / 1048576).toFixed(1)} MB). The limit is ${PHOTO_MAX_BYTES / 1048576} MB.`;
  return null;
}

/** Puts a new picture in a photo slot. Pan and zoom start over (they belonged to the old picture); fit, filter and frame are kept. */
export function replacePhoto(page: PageData, slotId: string, src: string): PageData {
  return setPhoto(page, slotId, { src, zoom: undefined, panX: undefined, panY: undefined });
}

/** Clears every adjustment on a photo (zoom, pan, fit, filter, frame) and keeps the picture. */
export function resetPhoto(page: PageData, slotId: string): PageData {
  return setPhoto(page, slotId, { zoom: undefined, panX: undefined, panY: undefined, fit: undefined, filter: undefined, frame: undefined });
}

/** True when a photo has any adjustment to reset. */
export const isAdjusted = (p: PhotoContent): boolean =>
  p.zoom !== undefined || p.panX !== undefined || p.panY !== undefined || p.fit !== undefined || p.filter !== undefined || p.frame !== undefined;

// ---------- Page controls (task 3.6) ----------

export const MIN_PAGES = 4;
export const MAX_PAGES = 16;

/** Page 1 is the cover: it cannot be deleted or moved, and nothing moves above it. All helpers below return the SAME array when the action is not allowed. */
export const canAddPage = (count: number) => count < MAX_PAGES;
export const canDeletePage = (count: number, i: number) => count > MIN_PAGES && i > 0 && i < count;
export const canMovePage = (count: number, i: number, dir: -1 | 1) => i > 0 && i < count && i + dir >= 1 && i + dir < count;

const insertAt = <T,>(list: T[], at: number, item: T): T[] => [...list.slice(0, at), item, ...list.slice(at)];

/** A new page with the given layout (photo slots get sample photos, text starts empty) right after page `after`; never before the cover. */
export function addPage(pages: PageData[], after: number, layout: Layout, seed = 0): PageData[] {
  if (!canAddPage(pages.length)) return pages;
  const at = Math.min(Math.max(after, 0), pages.length - 1) + 1;
  return insertAt(pages, at, swapLayout({ layout: "", slots: {} }, layout, seed));
}

/** A copy of page `i` right after it. The copy shares nothing with the original. */
export function duplicatePage(pages: PageData[], i: number): PageData[] {
  if (!canAddPage(pages.length) || i < 0 || i >= pages.length) return pages;
  return insertAt(pages, i + 1, structuredClone(pages[i]));
}

export function deletePage(pages: PageData[], i: number): PageData[] {
  return canDeletePage(pages.length, i) ? pages.filter((_, k) => k !== i) : pages;
}

/** Moves page `i` one place earlier (dir -1) or later (dir 1). */
export function movePage(pages: PageData[], i: number, dir: -1 | 1): PageData[] {
  if (!canMovePage(pages.length, i, dir)) return pages;
  const next = [...pages];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  return next;
}

/** Sets a page's background; undefined goes back to the layout's own. */
export function setPageBg(page: PageData, bg: ColorRef | undefined): PageData {
  const { bg: _old, ...rest } = page;
  return bg === undefined ? rest : { ...rest, bg };
}

// ---------- Page background (task 3.6e) ----------

/** Background colours a creator can pick, from the book's palette. "Layout's own" is the absence of a choice. */
export const PAGE_BG_CHOICES: [keyof Palette, string][] = [
  ["paper", "Paper"], ["soft", "Soft"], ["dark", "Dark"], ["accent", "Accent"], ["accent2", "Accent 2"],
];

const toRgb = (css: string): [number, number, number] | null => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(css.trim());
  if (!m) return null; // rgba(...) and names: unknown, treated as readable
  const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};
const luminance = ([r, g, b]: [number, number, number]) => {
  const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
/** WCAG contrast ratio, 1 to 21. Colours that cannot be read as hex count as fine (21). */
export function contrast(a: string, b: string): number {
  const x = toRgb(a), y = toRgb(b);
  if (!x || !y) return 21;
  const [hi, lo] = [luminance(x), luminance(y)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
}

/** True when a photo covers the whole page, so the page colour is never seen. */
export const bgHidden = (l: Layout): boolean => l.slots.some((s) => s.kind === "photo" && s.x <= 0 && s.y <= 0 && s.w >= 1 && s.h >= 1);

/** Does an earlier, opaque photo or shape cover the middle of slot `i`? Then its text sits on that, not on the page colour. */
function coveredBefore(l: Layout, i: number): boolean {
  const t = l.slots[i], cx = t.x + t.w / 2, cy = t.y + t.h / 2;
  return l.slots.slice(0, i).some((o) =>
    (o.kind === "photo" || (o.kind === "shape" && (o.shape === "rect" || o.shape === "ellipse") && (o.alpha ?? 1) >= 0.9)) &&
    !o.rot && cx >= o.x && cx <= o.x + o.w && cy >= o.y && cy <= o.y + o.h);
}

/** Name of the first text on this page that would be hard to read on `bg`, or null when all is fine.
 *  Only text that sits directly on the page colour is checked (not text over a photo or a solid panel). Needs 4.5:1, or 3:1 for large text. */
export function bgProblem(page: PageData, layout: Layout, palette: Palette, bg: ColorRef | undefined): string | null {
  const res = (c: ColorRef) => (c in palette ? palette[c as keyof Palette] : c);
  const back = res(bg ?? layout.bg);
  for (let i = 0; i < layout.slots.length; i++) {
    const t = layout.slots[i];
    if (t.kind !== "text") continue;
    const shown = t.auto === "folio" || !!t.text || (typeof page.slots[t.id] === "string" && (page.slots[t.id] as string).trim() !== "");
    if (!shown || coveredBefore(layout, i)) continue;
    const fg = res(page.styles?.[t.id]?.color ?? t.color);
    if (contrast(fg, back) < (t.size >= 0.07 ? 3 : 4.5)) return t.auto === "folio" ? "the page number" : slotName(layout, t as EditableSlot);
  }
  return null;
}

/** The palette backgrounds that keep all text readable on this page. The current choice is never removed. */
export function pageBgOptions(page: PageData, layout: Layout, palette: Palette): [keyof Palette, string][] {
  return PAGE_BG_CHOICES.filter(([k]) => k === page.bg || bgProblem(page, layout, palette, k) === null);
}
