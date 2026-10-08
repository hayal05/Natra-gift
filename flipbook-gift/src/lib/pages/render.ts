// Generic page renderer (task 2.1): draws any layout + page content into a w x h canvas context.
// Used for the editor, the real fold engine (as PageDrawFn) and the offline export.
import { drawSample, isSample, sampleNumber } from "./sample";
import type {
  BookStyle, ColorRef, ImageMap, Layout, PageData, PhotoContent, PhotoSlotDef, ShapeSlotDef, SlotDef,
  TextSlotDef, TextStyle,
} from "./types";

const SIZE_STEP = { S: 0.85, M: 1, L: 1.2 } as const;
const MIN_SHRINK = 0.6; // text that does not fit shrinks down to 60% of its size, then is clipped
/** Text breaks onto a new line at the box width. A box may grow to this many lines (never past the page edges)
 *  before the font is shrunk, so a short title or caption wraps instead of turning tiny. */
const WRAP_LINES = 3;
/** Limits for the free text scale and box width (fractions of the page) set by handles, pinch and slider. */
export const TEXT_SCALE_MIN = 0.4, TEXT_SCALE_MAX = 4, TEXT_WIDTH_MIN = 0.12;
/** Font size factor of a text style: the free scale if the creator set one, otherwise the S/M/L step. */
export const sizeFactor = (st?: TextStyle): number => st?.scale ?? SIZE_STEP[st?.size ?? "M"];
const PAGE_MARGIN = 0.03; // growing text stays this far (fraction of page height) from the top and bottom edges

export const color = (book: BookStyle, ref: ColorRef): string =>
  ref in book.palette ? book.palette[ref as keyof BookStyle["palette"]] : ref;

/** Slot rectangle in CSS px (before rotation). Also used by the editor for hit-testing. */
export const slotRect = (s: SlotDef, w: number, h: number) => ({ x: s.x * w, y: s.y * h, w: s.w * w, h: s.h * h });
export const photoSlotRect = (s: PhotoSlotDef, p: PhotoContent | undefined, w: number, h: number) => ({ x: (p?.x ?? s.x) * w, y: (p?.y ?? s.y) * h, w: (p?.w ?? s.w) * w, h: (p?.h ?? s.h) * h });
export const textSlotRect = (s: TextSlotDef, st: TextStyle | undefined, w: number, h: number) => ({
  x: (s.x + (st?.x ?? 0)) * w, y: (s.y + (st?.y ?? 0)) * h, w: (st?.w ?? s.w) * w, h: s.h * h,
});

/**
 * Single source of truth for how a text slot is typeset: font, shrink-to-fit size, line height and wrapped lines.
 * The page renderer (drawText), the selection outline (textFitRect) and the on-page text editor (textEditBox)
 * all call this, so what is edited is always exactly what is drawn. Leaves `c` set to the final font.
 */
function typeset(c: CanvasRenderingContext2D, s: TextSlotDef, text: string, st: TextStyle | undefined, book: BookStyle, r: { y: number; w: number; h: number }, w: number, h: number) {
  const role = st?.font ?? s.font;
  const family = book.fonts[role];
  const weight = Math.min(s.weight ?? 400, role === "display" ? book.fonts.displayMaxWeight ?? 1000 : 1000);
  const lh = s.lh ?? 1.3;
  const tracking = s.tracking ?? 0;
  const base = s.size * w * sizeFactor(st);
  const setFont = (px: number) => {
    c.font = `${s.italic ? "italic " : ""}${weight} ${px}px ${family}`;
    // letterSpacing is missing in older Safari; the text is simply a little tighter there.
    (c as unknown as { letterSpacing: string }).letterSpacing = tracking ? `${tracking * px}px` : "0px";
  };
  // Room the box may grow into, in the direction its vertical alignment implies, without leaving the page.
  const lo = h * PAGE_MARGIN, hi = h * (1 - PAGE_MARGIN);
  const room = s.valign === "bottom" ? r.y + r.h - lo : s.valign === "middle" ? 2 * Math.min(r.y + r.h / 2 - lo, hi - (r.y + r.h / 2)) : hi - r.y;
  const capAt = (px: number) => Math.max(r.h, Math.min(WRAP_LINES * px * lh, room));
  // Wrap at the box width first. Shrink only if the lines still do not fit the (grown) box, or a word is wider than the box.
  let px = base;
  let lines: string[] = [];
  // Size set by the creator (handle, pinch, slider): never shrink. Wrap at the box width and let the box grow as tall as the text needs.
  const manual = st?.scale !== undefined;
  if (manual) {
    setFont(px);
    lines = wrapLines(c, text, r.w);
    const capH = Math.max(r.h, lines.length * px * lh);
    const regionY = s.valign === "bottom" ? r.y + r.h - capH : s.valign === "middle" ? r.y + (r.h - capH) / 2 : r.y;
    return { family, weight, lh, tracking, px, lines, capH, regionY };
  }
  for (;;) {
    setFont(px);
    lines = wrapLines(c, text, r.w);
    const wordFits = text.split(/\s+/).every((wd) => c.measureText(wd).width <= r.w);
    if ((lines.length * px * lh <= capAt(px) && wordFits) || px <= base * MIN_SHRINK) break;
    px = Math.max(base * MIN_SHRINK, px * 0.93);
  }
  const capH = capAt(px);
  // The region text may occupy at this size (the slot, grown up/down/both ways), used for clipping and for the editor.
  const regionY = s.valign === "bottom" ? r.y + r.h - capH : s.valign === "middle" ? r.y + (r.h - capH) / 2 : r.y;
  return { family, weight, lh, tracking, px, lines, capH, regionY };
}

/**
 * Geometry for the on-page text editor (page px, same space as the slot rectangle).
 * The editor box is the whole slot; font size and line height are the exact values the page is drawn with, and
 * `padTop` reproduces the slot's vertical alignment, so the caret is as tall as the letters and sits on the drawn line.
 */
export function textEditBox(s: TextSlotDef, st: TextStyle | undefined, raw: string, book: BookStyle, w: number, h: number) {
  const r = textSlotRect(s, st, w, h);
  const text = s.upper ? raw.toUpperCase() : raw;
  const align = st?.align ?? s.align ?? "left";
  const c = document.createElement("canvas").getContext("2d");
  let px = s.size * w * sizeFactor(st), lh = s.lh ?? 1.3, lines = 1;
  const role = st?.font ?? s.font;
  const family = book.fonts[role];
  const weight = Math.min(s.weight ?? 400, role === "display" ? book.fonts.displayMaxWeight ?? 1000 : 1000);
  let capH = r.h;
  if (c && text.trim()) { const t = typeset(c, s, text, st, book, r, w, h); px = t.px; lh = t.lh; lines = t.lines.length; capH = t.capH; }
  const lineH = px * lh, total = lines * lineH;
  // The editor is the slot, grown only as far as the wrapped text needs (same rule the page is drawn with).
  const boxH = Math.max(r.h, Math.min(total, capH));
  const boxY = s.valign === "bottom" ? r.y + r.h - boxH : s.valign === "middle" ? r.y + (r.h - boxH) / 2 : r.y;
  const padTop = s.valign === "bottom" ? Math.max(0, boxH - total) : s.valign === "middle" ? Math.max(0, (boxH - total) / 2) : 0;
  return {
    x: r.x, y: boxY, w: r.w, h: boxH, px, lineH, padTop, align, family, weight,
    italic: !!s.italic, tracking: (s.tracking ?? 0) * px, upper: !!s.upper,
  };
}

export function textFitRect(s: TextSlotDef, st: TextStyle | undefined, raw: string, book: BookStyle, w: number, h: number) {
  const r = textSlotRect(s, st, w, h);
  const text = s.auto === "folio" ? raw : s.upper ? raw.toUpperCase() : raw;
  if (!text.trim()) {
    const px = s.size * w * sizeFactor(st);
    return { x: r.x, y: r.y, w: Math.max(px, 12), h: Math.max(px * 1.15, 16) };
  }
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return r;
  const { lh, tracking, px, lines } = typeset(c, s, text, st, book, r, w, h);

  // Match drawText baseline math and measure actual glyph bounds, not the layout slot.
  const align = st?.align ?? s.align ?? "left";
  const widths = lines.map((line) => c.measureText(line).width + Math.max(0, line.length - 1) * tracking * px);
  const textW = Math.max(1, Math.min(r.w, ...widths));
  const anchor = align === "center" ? r.x + r.w / 2 : align === "right" ? r.x + r.w : r.x;
  const metrics = lines.map((line, i) => {
    const m = c.measureText(line);
    const total = lines.length * px * lh;
    const textTop = s.valign === "bottom" ? r.y + r.h - total : s.valign === "middle" ? r.y + (r.h - total) / 2 : r.y;
    const baseline = textTop + px * lh * i + px * (lh / 2 + 0.35);
    const ascent = m.actualBoundingBoxAscent || px * 0.78;
    const descent = m.actualBoundingBoxDescent || px * 0.22;
    const width = m.width + Math.max(0, line.length - 1) * tracking * px;
    const lineLeft = align === "left" ? anchor : align === "center" ? anchor - width / 2 : anchor - width;
    return { left: lineLeft, right: lineLeft + width, top: baseline - ascent, bottom: baseline + descent };
  });
  const minX = Math.max(0, Math.min(...metrics.map((m) => m.left)) - 2);
  const maxX = Math.min(w, Math.max(...metrics.map((m) => m.right)) + 2);
  const minY = Math.max(0, Math.min(...metrics.map((m) => m.top)) - 2);
  const maxY = Math.min(h, Math.max(...metrics.map((m) => m.bottom)) + 2);
  return { x: minX, y: minY, w: Math.max(2, maxX - minX), h: Math.max(2, maxY - minY) };
}

/** What is drawn on a page, bottom to top: the layout's components minus the ones the creator deleted (`hidden`), then the ones added (`extras`) (task 10.4). */
export function pageSlots(layout: Layout, page: Pick<PageData, "hidden" | "extras">): SlotDef[] {
  const hidden = page.hidden;
  const base = hidden?.length ? layout.slots.filter((s) => !hidden.includes(s.id)) : layout.slots;
  return page.extras?.length ? [...base, ...page.extras] : base;
}

/** The slot under a point (px), topmost first; text and photo slots only. Rotation is ignored (good enough for taps). */
export function slotAt(layout: Layout, w: number, h: number, px: number, py: number, page?: Pick<PageData, "hidden" | "extras">): SlotDef | null {
  const list = page ? pageSlots(layout, page) : layout.slots; // with a page: deleted components are skipped and added ones count (task 10.4b)
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    if (s.kind === "shape") continue;
    const r = s.kind === "text" ? textSlotRect(s, undefined, w, h) : slotRect(s, w, h);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return s;
  }
  return null;
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y);
  c.arcTo(x + w, y, x + w, y + h, k);
  c.arcTo(x + w, y + h, x, y + h, k);
  c.arcTo(x, y + h, x, y, k);
  c.arcTo(x, y, x + w, y, k);
  c.closePath();
}

/** Break text into lines that fit maxW. Paragraphs split on newlines; very long words are broken by character. */
function wrapLines(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? line + " " + word : word;
      if (c.measureText(test).width <= maxW || !line) {
        line = test;
        while (c.measureText(line).width > maxW && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && c.measureText(line.slice(0, cut)).width > maxW) cut--;
          out.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

function drawText(c: CanvasRenderingContext2D, s: TextSlotDef, raw: string, st: TextStyle | undefined, book: BookStyle, w: number, h: number, pageNo: number) {
  const r = textSlotRect(s, st, w, h);
  let text = s.auto === "folio" ? `${String(pageNo + 1).padStart(2, "0")}  ·  ${book.masthead}` : s.text ?? raw;
  if (!text.trim()) return;
  if (s.upper) text = text.toUpperCase();
  const align = st?.align ?? s.align ?? "left";
  const { lh, px, lines: wrapped, capH, regionY } = typeset(c, s, text, st, book, r, w, h);
  let lines = wrapped;

  // Still too long at the smallest size: keep only the whole lines that fit and end with an ellipsis,
  // anchored at the top so the start of the text is never the part that gets cut off.
  const fits = Math.max(1, Math.floor(capH / (px * lh)));
  const overflow = lines.length > fits;
  if (overflow) {
    lines = lines.slice(0, fits);
    let last = lines[fits - 1].replace(/[\s.,;:!?-]+$/, "");
    while (last.length > 1 && c.measureText(last + "\u2026").width > r.w) last = last.slice(0, -1);
    lines[fits - 1] = last + "\u2026";
  }

  c.save();
  c.beginPath();
  c.rect(r.x, regionY, r.w, capH);
  c.clip();
  c.fillStyle = color(book, st?.color ?? s.color);
  c.textAlign = align;
  c.textBaseline = "alphabetic";
  const total = lines.length * px * lh;
  const top = overflow ? regionY : s.valign === "bottom" ? r.y + r.h - total : s.valign === "middle" ? r.y + (r.h - total) / 2 : r.y;
  const x = align === "left" ? r.x : align === "center" ? r.x + r.w / 2 : r.x + r.w;
  lines.forEach((ln, i) => c.fillText(ln, x, top + px * lh * i + px * (lh / 2 + 0.35)));
  c.restore();
}

/** Placeholder for an empty or still-loading photo: soft tinted gradient with a small mountain-and-sun mark. */
function drawPlaceholder(c: CanvasRenderingContext2D, book: BookStyle, x: number, y: number, w: number, h: number) {
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, color(book, "soft"));
  g.addColorStop(1, color(book, "accent2"));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  const m = Math.min(w, h) * 0.18;
  const cx = x + w / 2, cy = y + h / 2;
  c.fillStyle = "rgba(255,255,255,.65)";
  c.beginPath();
  c.arc(cx + m * 0.7, cy - m * 0.5, m * 0.28, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(cx - m * 1.2, cy + m * 0.9);
  c.lineTo(cx - m * 0.3, cy - m * 0.3);
  c.lineTo(cx + m * 0.2, cy + m * 0.3);
  c.lineTo(cx + m * 0.55, cy);
  c.lineTo(cx + m * 1.2, cy + m * 0.9);
  c.closePath();
  c.fill();
}

/** Draw the image into the box: "fill" covers it, "fit" shows it whole; zoom and pan only matter when it overflows. */
function drawImageIn(c: CanvasRenderingContext2D, img: CanvasImageSource & { width?: number; height?: number }, p: PhotoContent, x: number, y: number, w: number, h: number) {
  const iw = (img as HTMLImageElement).naturalWidth || img.width || 1;
  const ih = (img as HTMLImageElement).naturalHeight || img.height || 1;
  const fit = p.fit === "fit";
  const zoom = Math.min(3, Math.max(1, p.zoom ?? 1));
  const scale = (fit ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * zoom;
  const dw = iw * scale, dh = ih * scale;
  // Pan -1..1 moves across the overflow only (no pan when the image fits inside the box).
  const ox = Math.max(0, dw - w) / 2 * -(p.panX ?? 0);
  const oy = Math.max(0, dh - h) / 2 * -(p.panY ?? 0);
  if (fit) { c.fillStyle = "rgba(0,0,0,.06)"; c.fillRect(x, y, w, h); }
  c.drawImage(img, x + (w - dw) / 2 + ox, y + (h - dh) / 2 + oy, dw, dh);
}

function drawPhoto(c: CanvasRenderingContext2D, s: PhotoSlotDef, raw: string | PhotoContent | undefined, book: BookStyle, images: ImageMap, w: number, h: number) {
  const p: PhotoContent = typeof raw === "object" && raw ? raw : { src: "" };
  const r = photoSlotRect(s, p, w, h);
  const frame = p.frame ?? s.frame ?? "none";
  const pad = frame === "border" ? Math.min(r.w, r.h) * 0.045 : 0;
  const bottom = frame === "border" ? (s.matBottom ?? 0) * r.h : 0;
  const ix = r.x + pad, iy = r.y + pad, iw = r.w - pad * 2, ih = r.h - pad * 2 - bottom;

  if (frame === "border" || s.shadow) {
    c.save();
    if (s.shadow || frame === "border") { c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = w * 0.035; c.shadowOffsetY = w * 0.01; }
    c.fillStyle = "#fff";
    c.fillRect(r.x, r.y, r.w, r.h);
    c.restore();
  }
  c.save();
  if (frame === "rounded") roundRect(c, ix, iy, iw, ih, Math.min(iw, ih) * 0.08);
  else { c.beginPath(); c.rect(ix, iy, iw, ih); }
  c.clip();
  const img = p.src ? images.get(p.src) : undefined;
  if (img) drawImageIn(c, img, p, ix, iy, iw, ih);
  else if (isSample(p.src)) drawSample(c, book.palette, sampleNumber(p.src), ix, iy, iw, ih, p.zoom, p.panX, p.panY);
  else drawPlaceholder(c, book, ix, iy, iw, ih);

  // Filters by blend mode: works everywhere, unlike ctx.filter (missing on older iOS Safari).
  if (p.filter === "bw") { c.globalCompositeOperation = "saturation"; c.fillStyle = "#808080"; c.fillRect(ix, iy, iw, ih); }
  else if (p.filter === "warm") { c.globalCompositeOperation = "soft-light"; c.fillStyle = "rgba(255,160,70,.55)"; c.fillRect(ix, iy, iw, ih); }
  c.restore();
}

function drawShape(c: CanvasRenderingContext2D, s: ShapeSlotDef, book: BookStyle, w: number, h: number) {
  const r = slotRect(s, w, h);
  const col = color(book, s.fill);
  c.save();
  c.globalAlpha = s.alpha ?? 1;
  if (s.shape === "scrim-down" || s.shape === "scrim-up") {
    // Fades from solid colour at one edge to transparent at the other, to keep text readable over photos.
    const top = s.shape === "scrim-down";
    const g = c.createLinearGradient(0, top ? r.y : r.y + r.h, 0, top ? r.y + r.h : r.y);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(r.x, r.y, r.w, r.h);
  } else {
    if (s.shadow) { c.shadowColor = "rgba(0,0,0,.28)"; c.shadowBlur = w * 0.035; c.shadowOffsetY = w * 0.01; }
    c.fillStyle = col;
    if (s.shape === "ellipse") { c.beginPath(); c.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2); c.fill(); }
    else c.fillRect(r.x, r.y, r.w, r.h); // "line" is just a thin rect: give it a small h
  }
  c.restore();
}

/** Draw one page. `pageNo` is the zero-based position in the book (for the folio). */
export function renderPage(
  c: CanvasRenderingContext2D, w: number, h: number,
  page: PageData, layout: Layout, book: BookStyle, images: ImageMap, pageNo = 0,
) {
  c.save();
  c.fillStyle = color(book, page.bg ?? layout.bg);
  c.fillRect(0, 0, w, h);
  for (const s of pageSlots(layout, page)) {
    c.save();
    if (s.rot) {
      c.translate(s.rot.cx * w, s.rot.cy * h);
      c.rotate((s.rot.deg * Math.PI) / 180);
      c.translate(-s.rot.cx * w, -s.rot.cy * h);
    }
    const content = page.slots[s.id];
    if (s.kind === "text") drawText(c, s, typeof content === "string" ? content : "", page.styles?.[s.id], book, w, h, pageNo);
    else if (s.kind === "photo") drawPhoto(c, s, content, book, images, w, h);
    else drawShape(c, s, book, w, h);
    c.restore();
  }
  c.restore();
}

/** Adapter for the fold engine: a PageDrawFn for one page. Layouts are looked up by id; unknown ids draw a blank page. */
export function pageDrawFn(page: PageData, layouts: Record<string, Layout>, book: BookStyle, images: ImageMap) {
  return (c: CanvasRenderingContext2D, w: number, h: number, index: number) => {
    const layout = layouts[page.layout];
    if (!layout) { c.fillStyle = color(book, "paper"); c.fillRect(0, 0, w, h); return; }
    renderPage(c, w, h, page, layout, book, images, index);
  };
}

/** Load every photo `src` used by the pages. Sample photos ("sample:N") are drawn in code and need no loading. Failed images are skipped (their slots draw the placeholder). */
export async function loadImages(pages: PageData[], into: ImageMap = new Map()): Promise<ImageMap> {
  const srcs = new Set<string>();
  for (const p of pages) for (const v of Object.values(p.slots)) if (typeof v === "object" && v.src && !isSample(v.src) && !into.has(v.src)) srcs.add(v.src);
  await Promise.all([...srcs].map((src) => new Promise<void>((done) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { into.set(src, img); done(); };
    img.onerror = () => done();
    img.src = src;
  })));
  return into;
}
