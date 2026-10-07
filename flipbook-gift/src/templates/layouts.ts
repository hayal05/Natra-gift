// Layout library (task 2.2): 24 layouts, all plain data drawn by the generic renderer in src/lib/pages.
// Every layout has at least one photo slot. Adding a layout means adding an entry here, nothing else.
//
// Slot id convention (so content carries over when a page swaps layout, task 3.3):
//   photos  p1 p2 p3
//   text    kicker (small label) · title · body · body2 (second column) · caption · caption2 · caption3
//           byline (cover "For ...") · sign (signature) · quote
// Geometry is in fractions of the page (3:4). Colours are palette names or literal CSS colours.
import type { Layout, LayoutGroup, PhotoSlotDef, ShapeSlotDef, TextSlotDef } from "../lib/pages/types";

/** Grey hints the editor shows in empty text slots. Never rendered into the book. */
const HINTS: Record<string, string> = {
  kicker: "Small label", title: "Title", body: "Write something...", body2: "More text...",
  caption: "Caption", caption2: "Caption", caption3: "Caption", byline: "For ...", sign: "Your name", quote: "A line that means something",
};

type Opt<T> = Partial<Omit<T, "kind" | "id" | "x" | "y" | "w" | "h">>;
const T = (id: string, x: number, y: number, w: number, h: number, o: Opt<TextSlotDef> = {}): TextSlotDef =>
  ({ kind: "text", id, x, y, w, h, font: "body", size: 0.04, color: "ink", hint: HINTS[id], ...o });
const P = (id: string, x: number, y: number, w: number, h: number, o: Opt<PhotoSlotDef> = {}): PhotoSlotDef =>
  ({ kind: "photo", id, x, y, w, h, ...o });
const S = (id: string, shape: ShapeSlotDef["shape"], x: number, y: number, w: number, h: number, fill: string, o: Opt<ShapeSlotDef> = {}): ShapeSlotDef =>
  ({ kind: "shape", id, shape, x, y, w, h, fill, ...o });

// Recurring text styles.
const KICKER = { size: 0.03, weight: 700, tracking: 0.14, upper: true, color: "accent" } as const;
const FOLIO = { auto: "folio", size: 0.026, weight: 600, tracking: 0.12, valign: "middle" } as const;
const folio = (color = "ink") => T("folio", 0.08, 0.94, 0.84, 0.035, { ...FOLIO, color, hint: undefined });
const W = "#fff";

const L = (id: string, name: string, group: LayoutGroup, bg: string, ...slots: Layout["slots"]): Layout => ({ id, name, group, bg, slots });

export const LAYOUT_LIST: Layout[] = [
  // ---------- Covers (4) ----------
  L("cover-full", "Full-photo cover", "cover", "dark",
    P("p1", 0, 0, 1, 1),
    S("s1", "scrim-down", 0, 0, 1, 0.42, "#000", { alpha: 0.55 }),
    S("s2", "scrim-up", 0, 0.55, 1, 0.45, "#000", { alpha: 0.7 }),
    T("title", 0.04, 0.05, 0.92, 0.2, { font: "display", size: 0.15, weight: 800, upper: true, color: W, align: "center", valign: "middle", lh: 1 }),
    T("kicker", 0.08, 0.26, 0.84, 0.05, { size: 0.03, weight: 600, tracking: 0.14, upper: true, color: W, align: "center" }),
    T("body", 0.08, 0.64, 0.84, 0.2, { size: 0.037, weight: 600, color: W, valign: "bottom", lh: 1.5 }),
    T("byline", 0.08, 0.86, 0.84, 0.08, { font: "display", italic: true, size: 0.065, color: W, valign: "bottom" })),

  L("cover-frame", "Framed cover", "cover", "paper",
    T("kicker", 0.08, 0.035, 0.84, 0.04, { ...KICKER, align: "center", color: "accent" }),
    T("title", 0.06, 0.08, 0.88, 0.13, { font: "display", size: 0.115, weight: 800, upper: true, align: "center", valign: "middle", lh: 1 }),
    S("rule", "line", 0.08, 0.225, 0.84, 0.004, "ink"),
    P("p1", 0.1, 0.25, 0.8, 0.5, { shadow: true }),
    T("body", 0.1, 0.775, 0.8, 0.1, { size: 0.036, weight: 600, align: "center", valign: "middle", lh: 1.5 }),
    T("byline", 0.08, 0.89, 0.84, 0.07, { font: "display", italic: true, size: 0.06, color: "accent", align: "center", valign: "middle" })),

  L("cover-split", "Split cover", "cover", "dark",
    P("p1", 0, 0, 1, 0.62),
    T("kicker", 0.08, 0.65, 0.84, 0.04, { ...KICKER, color: "accent2" }),
    T("title", 0.08, 0.7, 0.84, 0.16, { font: "display", size: 0.11, weight: 800, upper: true, color: W, valign: "top", lh: 1 }),
    T("byline", 0.08, 0.88, 0.4, 0.07, { font: "display", italic: true, size: 0.06, color: W, valign: "bottom" }),
    T("body", 0.52, 0.88, 0.4, 0.07, { size: 0.028, weight: 600, color: W, align: "right", valign: "bottom", lh: 1.4 })),

  L("cover-bold", "Bold cover", "cover", "accent",
    T("kicker", 0.07, 0.04, 0.86, 0.04, { size: 0.03, weight: 700, tracking: 0.14, upper: true, color: W }),
    T("title", 0.06, 0.09, 0.88, 0.3, { font: "display", size: 0.2, weight: 900, upper: true, color: W, valign: "top", lh: 0.95 }),
    P("p1", 0.07, 0.42, 0.86, 0.4, { frame: "rounded" }),
    T("body", 0.07, 0.835, 0.86, 0.06, { size: 0.034, weight: 600, color: W, valign: "middle" }),
    T("byline", 0.07, 0.9, 0.86, 0.07, { font: "display", italic: true, size: 0.06, color: W, valign: "middle" })),

  // ---------- Photo pages (3) ----------
  L("photo-full", "Full photo", "photo", "dark",
    P("p1", 0, 0, 1, 1),
    S("s1", "scrim-up", 0, 0.6, 1, 0.4, "#000", { alpha: 0.65 }),
    T("kicker", 0.08, 0.77, 0.84, 0.04, { ...KICKER, color: W }),
    T("caption", 0.08, 0.81, 0.84, 0.11, { font: "display", italic: true, size: 0.06, color: W, lh: 1.25 }),
    folio(W)),

  L("photo-framed", "Framed photo", "photo", "paper",
    P("p1", 0.1, 0.07, 0.8, 0.6, { frame: "border" }),
    T("kicker", 0.1, 0.72, 0.8, 0.04, KICKER),
    T("caption", 0.1, 0.765, 0.8, 0.13, { font: "display", italic: true, size: 0.055, lh: 1.25 }),
    folio()),

  L("photo-rounded", "Rounded photo", "photo", "soft",
    T("title", 0.08, 0.05, 0.84, 0.13, { font: "display", size: 0.075, weight: 800, valign: "middle", lh: 1.1 }),
    P("p1", 0.08, 0.2, 0.84, 0.55, { frame: "rounded" }),
    T("caption", 0.08, 0.78, 0.84, 0.12, { size: 0.038, lh: 1.45 }),
    folio()),

  // ---------- Polaroids (2) ----------
  L("polaroid-one", "Polaroid", "photo", "soft",
    P("p1", 0.14, 0.08, 0.72, 0.68, { frame: "border", matBottom: 0.2, rot: { deg: -4, cx: 0.5, cy: 0.42 } }),
    T("caption", 0.18, 0.63, 0.64, 0.1, { font: "display", italic: true, size: 0.055, align: "center", valign: "middle", rot: { deg: -4, cx: 0.5, cy: 0.42 } }),
    T("kicker", 0.1, 0.83, 0.8, 0.05, { ...KICKER, align: "center" }),
    folio()),

  L("polaroid-two", "Two polaroids", "photo", "soft",
    P("p1", 0.12, 0.04, 0.62, 0.43, { frame: "border", matBottom: 0.16, rot: { deg: -5, cx: 0.43, cy: 0.255 } }),
    T("caption", 0.15, 0.405, 0.56, 0.06, { font: "display", italic: true, size: 0.045, align: "center", valign: "middle", rot: { deg: -5, cx: 0.43, cy: 0.255 } }),
    P("p2", 0.28, 0.49, 0.62, 0.43, { frame: "border", matBottom: 0.16, rot: { deg: 4, cx: 0.59, cy: 0.705 } }),
    T("caption2", 0.31, 0.855, 0.56, 0.06, { font: "display", italic: true, size: 0.045, align: "center", valign: "middle", rot: { deg: 4, cx: 0.59, cy: 0.705 } }),
    folio()),

  // ---------- Split photo + caption (3) ----------
  L("split-top", "Photo on top", "photo", "paper",
    P("p1", 0, 0, 1, 0.6),
    T("kicker", 0.08, 0.64, 0.84, 0.04, KICKER),
    T("title", 0.08, 0.68, 0.84, 0.1, { font: "display", size: 0.07, weight: 800, valign: "middle", lh: 1.1 }),
    T("body", 0.08, 0.79, 0.84, 0.13, { size: 0.037, lh: 1.5 }),
    folio()),

  L("split-side", "Photo on the side", "photo", "paper",
    P("p1", 0, 0, 0.5, 1),
    T("kicker", 0.56, 0.08, 0.36, 0.04, KICKER),
    T("title", 0.56, 0.13, 0.36, 0.3, { font: "display", size: 0.065, weight: 800, lh: 1.15 }),
    T("body", 0.56, 0.45, 0.36, 0.42, { size: 0.034, lh: 1.55 }),
    T("folio", 0.56, 0.94, 0.38, 0.035, { ...FOLIO, hint: undefined, color: "ink" })),

  L("split-bottom", "Photo below", "photo", "dark",
    T("kicker", 0.08, 0.05, 0.84, 0.04, { ...KICKER, color: "accent2" }),
    T("title", 0.08, 0.1, 0.84, 0.16, { font: "display", size: 0.075, weight: 800, color: W, lh: 1.1 }),
    T("body", 0.08, 0.28, 0.84, 0.19, { size: 0.036, color: W, lh: 1.5 }),
    P("p1", 0, 0.5, 1, 0.5)),

  // ---------- Collages (4) ----------
  L("collage-2", "Two photos stacked", "collage", "paper",
    T("kicker", 0.08, 0.04, 0.84, 0.04, KICKER),
    P("p1", 0.08, 0.09, 0.84, 0.37),
    P("p2", 0.08, 0.49, 0.84, 0.3),
    T("caption", 0.08, 0.81, 0.84, 0.11, { font: "display", italic: true, size: 0.052, lh: 1.25 }),
    folio()),

  L("collage-2-side", "Two tall photos", "collage", "soft",
    P("p1", 0.06, 0.05, 0.43, 0.6, { frame: "border" }),
    P("p2", 0.51, 0.11, 0.43, 0.6, { frame: "border" }),
    T("title", 0.08, 0.76, 0.84, 0.08, { font: "display", size: 0.06, weight: 800, valign: "middle" }),
    T("caption", 0.08, 0.84, 0.84, 0.09, { size: 0.034, lh: 1.45 }),
    folio()),

  L("collage-3", "Three photos", "collage", "paper",
    P("p1", 0.06, 0.05, 0.88, 0.44),
    P("p2", 0.06, 0.51, 0.43, 0.3),
    P("p3", 0.51, 0.51, 0.43, 0.3),
    T("caption", 0.08, 0.84, 0.84, 0.09, { font: "display", italic: true, size: 0.05, lh: 1.25 }),
    folio()),

  L("collage-3-strip", "Three-photo strip", "collage", "dark",
    P("p1", 0.06, 0.05, 0.5, 0.26, { frame: "rounded" }),
    T("caption", 0.6, 0.05, 0.34, 0.26, { font: "display", italic: true, size: 0.045, color: W, valign: "middle" }),
    P("p2", 0.44, 0.35, 0.5, 0.26, { frame: "rounded" }),
    T("caption2", 0.06, 0.35, 0.34, 0.26, { font: "display", italic: true, size: 0.045, color: W, valign: "middle", align: "right" }),
    P("p3", 0.06, 0.65, 0.5, 0.26, { frame: "rounded" }),
    T("caption3", 0.6, 0.65, 0.34, 0.26, { font: "display", italic: true, size: 0.045, color: W, valign: "middle" }),
    folio(W)),

  // ---------- Letters and text (3) ----------
  L("letter", "Letter", "text", "paper",
    P("p1", 0, 0, 1, 0.26),
    T("kicker", 0.08, 0.3, 0.84, 0.04, KICKER),
    T("title", 0.08, 0.345, 0.84, 0.08, { font: "display", size: 0.065, weight: 800, valign: "middle" }),
    T("body", 0.08, 0.45, 0.84, 0.4, { size: 0.04, lh: 1.55 }),
    T("sign", 0.08, 0.86, 0.84, 0.07, { font: "display", italic: true, size: 0.07, color: "accent", valign: "middle" }),
    folio()),

  L("letter-corner", "Letter with small photo", "text", "paper",
    P("p1", 0.08, 0.06, 0.3, 0.2, { frame: "rounded" }),
    T("kicker", 0.43, 0.075, 0.49, 0.04, KICKER),
    T("title", 0.43, 0.12, 0.49, 0.14, { font: "display", size: 0.06, weight: 800, lh: 1.1 }),
    T("body", 0.08, 0.31, 0.84, 0.54, { size: 0.04, lh: 1.55 }),
    T("sign", 0.08, 0.86, 0.84, 0.07, { font: "display", italic: true, size: 0.07, color: "accent", valign: "middle" }),
    folio()),

  L("two-column", "Two columns", "text", "paper",
    T("title", 0.08, 0.05, 0.84, 0.13, { font: "display", size: 0.075, weight: 800, valign: "middle", lh: 1.1 }),
    P("p1", 0.08, 0.2, 0.84, 0.25),
    T("body", 0.08, 0.49, 0.4, 0.4, { size: 0.031, lh: 1.55 }),
    S("rule", "line", 0.495, 0.49, 0.002, 0.38, "ink", { alpha: 0.3 }),
    T("body2", 0.52, 0.49, 0.4, 0.4, { size: 0.031, lh: 1.55 }),
    folio()),

  // ---------- Quotes (2) and list (1) ----------
  L("quote-big", "Big quote", "quote", "accent",
    T("mark", 0.07, 0.03, 0.4, 0.2, { font: "display", size: 0.3, weight: 800, color: "rgba(255,255,255,.4)", text: "\u201C", lh: 1 }),
    T("quote", 0.08, 0.2, 0.84, 0.36, { font: "display", size: 0.08, weight: 700, color: W, valign: "middle", lh: 1.2 }),
    T("byline", 0.08, 0.58, 0.84, 0.05, { size: 0.032, weight: 600, tracking: 0.08, upper: true, color: W }),
    P("p1", 0.08, 0.67, 0.84, 0.23, { frame: "rounded" }),
    folio(W)),

  L("quote-photo", "Quote over photo", "quote", "dark",
    P("p1", 0, 0, 1, 1),
    S("s1", "rect", 0, 0, 1, 1, "#000", { alpha: 0.3 }),
    S("s2", "scrim-up", 0, 0.35, 1, 0.65, "#000", { alpha: 0.7 }),
    T("quote", 0.08, 0.5, 0.84, 0.3, { font: "display", italic: true, size: 0.08, color: W, valign: "bottom", lh: 1.2 }),
    T("byline", 0.08, 0.82, 0.84, 0.05, { size: 0.032, weight: 600, tracking: 0.08, upper: true, color: W }),
    folio(W)),

  L("list", "List", "text", "paper",
    T("title", 0.08, 0.06, 0.4, 0.32, { font: "display", size: 0.085, weight: 800, lh: 1.05 }),
    P("p1", 0.52, 0, 0.48, 0.4),
    T("kicker", 0.08, 0.43, 0.84, 0.04, KICKER),
    T("body", 0.08, 0.48, 0.84, 0.43, { size: 0.042, lh: 1.6 }),
    folio()),

  // ---------- Closing (2) ----------
  L("closing", "Closing", "closing", "paper",
    P("p1", 0.1, 0.07, 0.8, 0.5, { frame: "border" }),
    T("title", 0.08, 0.61, 0.84, 0.12, { font: "display", size: 0.085, weight: 800, align: "center", valign: "middle", lh: 1.1 }),
    T("body", 0.12, 0.74, 0.76, 0.1, { size: 0.037, align: "center", valign: "middle", lh: 1.5 }),
    T("sign", 0.08, 0.85, 0.84, 0.08, { font: "display", italic: true, size: 0.08, color: "accent", align: "center", valign: "middle" })),

  L("closing-dark", "Dark closing", "closing", "dark",
    P("p1", 0.18, 0.08, 0.64, 0.48, { frame: "rounded" }),
    T("title", 0.08, 0.6, 0.84, 0.12, { font: "display", size: 0.085, weight: 800, color: W, align: "center", valign: "middle", lh: 1.1 }),
    T("body", 0.12, 0.73, 0.76, 0.1, { size: 0.037, color: W, align: "center", valign: "middle", lh: 1.5 }),
    T("sign", 0.08, 0.85, 0.84, 0.08, { font: "display", italic: true, size: 0.08, color: "accent2", align: "center", valign: "middle" })),
  L("chapter-number", "Chapter number", "text", "paper",
    S("band", "rect", 0, 0, 1, 0.18, "soft"),
    T("kicker", 0.08, 0.06, 0.84, 0.04, KICKER),
    T("title", 0.08, 0.2, 0.42, 0.28, { font: "display", size: 0.17, weight: 800, color: "accent", valign: "middle", lh: 0.9 }),
    P("p1", 0.55, 0.22, 0.37, 0.48, { frame: "border", shadow: true }),
    T("body", 0.08, 0.53, 0.42, 0.28, { size: 0.034, lh: 1.55 }),
    T("caption", 0.55, 0.72, 0.37, 0.12, { font: "display", italic: true, size: 0.035, lh: 1.3 }), folio()),

  L("birthday-number", "Birthday number", "cover", "accent",
    S("circle", "ellipse", 0.55, 0.03, 0.62, 0.62, "accent2", { alpha: 0.22 }),
    T("kicker", 0.07, 0.05, 0.86, 0.04, { ...KICKER, color: W }),
    T("title", 0.07, 0.12, 0.86, 0.3, { font: "display", size: 0.24, weight: 900, upper: true, color: W, lh: 0.88 }),
    P("p1", 0.08, 0.45, 0.84, 0.3, { frame: "rounded" }),
    T("body", 0.08, 0.79, 0.84, 0.07, { size: 0.034, weight: 600, color: W }),
    T("byline", 0.08, 0.88, 0.84, 0.06, { font: "display", italic: true, size: 0.05, color: W })),

  L("wedding-invite", "Wedding invitation", "cover", "paper",
    S("frame", "line", 0.06, 0.06, 0.88, 0.004, "accent2"),
    T("kicker", 0.12, 0.1, 0.76, 0.04, { ...KICKER, align: "center" }),
    T("title", 0.1, 0.16, 0.8, 0.16, { font: "display", size: 0.105, weight: 500, align: "center", valign: "middle", lh: 1 }),
    P("p1", 0.16, 0.35, 0.68, 0.35, { frame: "border" }),
    T("body", 0.13, 0.73, 0.74, 0.1, { size: 0.032, align: "center", valign: "middle", lh: 1.45 }),
    T("byline", 0.12, 0.86, 0.76, 0.07, { font: "display", italic: true, size: 0.055, color: "accent", align: "center", valign: "middle" })),

  L("quiet-apology", "Quiet apology", "text", "paper",
    S("rule", "line", 0.08, 0.13, 0.84, 0.003, "accent2"),
    T("kicker", 0.08, 0.07, 0.84, 0.04, KICKER),
    T("title", 0.08, 0.18, 0.84, 0.16, { font: "display", size: 0.09, weight: 700, lh: 1.05 }),
    T("body", 0.08, 0.38, 0.84, 0.35, { size: 0.041, lh: 1.65 }),
    P("p1", 0.08, 0.77, 0.23, 0.14, { frame: "rounded" }),
    T("sign", 0.36, 0.78, 0.56, 0.12, { font: "display", italic: true, size: 0.06, color: "accent", valign: "middle" }), folio()),

  L("contact-sheet", "Contact sheet", "collage", "paper",
    T("kicker", 0.07, 0.04, 0.86, 0.04, KICKER),
    P("p1", 0.07, 0.1, 0.27, 0.29, { frame: "border" }), P("p2", 0.365, 0.1, 0.27, 0.29, { frame: "border" }), P("p3", 0.66, 0.1, 0.27, 0.29, { frame: "border" }),
    P("p4", 0.07, 0.43, 0.27, 0.29, { frame: "border" }), P("p5", 0.365, 0.43, 0.27, 0.29, { frame: "border" }), P("p6", 0.66, 0.43, 0.27, 0.29, { frame: "border" }),
    T("caption", 0.07, 0.78, 0.86, 0.1, { font: "display", italic: true, size: 0.05, lh: 1.25 }), folio()),

  L("route-postcard", "Distance postcard", "photo", "soft",
    T("kicker", 0.08, 0.05, 0.84, 0.04, KICKER),
    T("title", 0.08, 0.1, 0.84, 0.11, { font: "display", size: 0.075, weight: 800 }),
    S("route", "line", 0.15, 0.29, 0.7, 0.006, "accent", { alpha: 0.7 }),
    S("dot1", "ellipse", 0.12, 0.265, 0.055, 0.055, "accent"), S("dot2", "ellipse", 0.825, 0.265, 0.055, 0.055, "accent"),
    P("p1", 0.08, 0.36, 0.84, 0.35, { frame: "rounded" }),
    T("body", 0.08, 0.75, 0.84, 0.12, { size: 0.034, lh: 1.45 }),
    T("caption", 0.08, 0.88, 0.84, 0.05, { size: 0.028, tracking: 0.08, upper: true, color: "accent" }), folio()),

  L("gratitude", "Gratitude statement", "quote", "soft",
    T("kicker", 0.08, 0.07, 0.84, 0.04, KICKER),
    T("quote", 0.08, 0.17, 0.84, 0.3, { font: "display", size: 0.075, weight: 700, color: "ink", valign: "middle", lh: 1.2 }),
    P("p1", 0.08, 0.53, 0.38, 0.27, { frame: "rounded" }),
    T("body", 0.51, 0.53, 0.41, 0.27, { size: 0.032, lh: 1.5 }),
    T("sign", 0.08, 0.84, 0.84, 0.07, { font: "display", italic: true, size: 0.05, color: "accent" }), folio()),
  L("love-editorial","Love editorial","cover","paper",T("kicker",0.08,0.06,0.84,0.04,KICKER),P("p1",0.08,0.13,0.84,0.5,{frame:"rounded",shadow:true}),T("title",0.08,0.66,0.84,0.12,{font:"display",size:0.1,weight:800,color:"accent"}),T("body",0.08,0.8,0.58,0.08,{size:0.03,lh:1.35}),T("byline",0.68,0.8,0.24,0.08,{font:"display",italic:true,size:0.035,color:"accent",align:"right"})),
  L("friends-grid","Friends grid","collage","soft",T("kicker",0.07,0.05,0.86,0.04,KICKER),T("title",0.07,0.11,0.86,0.13,{font:"display",size:0.11,weight:900,upper:true}),P("p1",0.07,0.27,0.41,0.28,{frame:"rounded"}),P("p2",0.52,0.27,0.41,0.28,{frame:"rounded"}),P("p3",0.07,0.59,0.27,0.25,{frame:"border"}),P("p4",0.365,0.59,0.27,0.25,{frame:"border"}),P("p5",0.66,0.59,0.27,0.25,{frame:"border"}),T("byline",0.07,0.88,0.86,0.05,{size:0.028,weight:700,tracking:0.06,upper:true})),
  L("just-because","Just because","cover","paper",S("circle","ellipse",0.7,0.05,0.22,0.22,"accent2",{alpha:0.8}),S("circle2","ellipse",0.03,0.67,0.16,0.16,"accent2",{alpha:0.5}),T("kicker",0.08,0.08,0.84,0.04,KICKER),T("title",0.08,0.16,0.84,0.2,{font:"display",size:0.16,weight:800,color:"accent",lh:0.9}),P("p1",0.12,0.4,0.76,0.31,{frame:"rounded",shadow:true}),T("body",0.08,0.76,0.84,0.08,{size:0.032,lh:1.4}),T("byline",0.08,0.87,0.84,0.05,{font:"display",italic:true,size:0.04,color:"accent"})),

  // ---------- Signature template systems ----------
  L("love-cover","Love — cinematic cover","cover","paper",
    S("wash","rect",0,0,1,1,"#f9e1e4",{alpha:0.35}),
    T("kicker",0.08,0.06,0.84,0.035,{...KICKER,color:"accent",align:"center"}),
    T("title",0.08,0.12,0.84,0.17,{font:"display",size:0.13,weight:800,align:"center",valign:"middle",lh:0.95}),
    P("p1",0.12,0.32,0.76,0.42,{frame:"rounded",shadow:true}),
    T("body",0.1,0.77,0.8,0.07,{size:0.03,align:"center",lh:1.35}),
    T("byline",0.1,0.87,0.8,0.05,{font:"display",italic:true,size:0.04,color:"accent",align:"center"})),
  L("love-editorial-2","Love — story page","text","paper",
    T("kicker",0.08,0.06,0.84,0.04,KICKER),
    T("title",0.08,0.12,0.84,0.12,{font:"display",size:0.085,weight:800,color:"accent",lh:1.05}),
    P("p1",0.08,0.28,0.42,0.48,{frame:"rounded"}),
    T("body",0.55,0.29,0.37,0.42,{size:0.033,lh:1.55}),
    T("sign",0.55,0.75,0.37,0.08,{font:"display",italic:true,size:0.05,color:"accent"}),
    folio()),
  L("love-gallery","Love — gallery","photo","soft",
    T("kicker",0.08,0.05,0.84,0.04,KICKER),
    P("p1",0.08,0.13,0.52,0.39,{frame:"rounded"}), P("p2",0.56,0.13,0.36,0.25,{frame:"border"}), P("p3",0.56,0.42,0.36,0.25,{frame:"border"}),
    T("caption",0.08,0.73,0.84,0.12,{font:"display",italic:true,size:0.05,lh:1.25}), folio()),

  L("anniversary-cover","Anniversary — chapter cover","cover","dark",
    T("kicker",0.08,0.07,0.84,0.04,{...KICKER,color:"accent2"}),
    T("title",0.08,0.13,0.84,0.27,{font:"display",size:0.18,weight:800,color:W,lh:0.9}),
    P("p1",0.48,0.12,0.42,0.48,{frame:"border"}),
    T("body",0.08,0.51,0.35,0.2,{size:0.035,color:W,lh:1.5}),
    T("byline",0.08,0.82,0.84,0.07,{font:"display",italic:true,size:0.06,color:"accent2"})),
  L("anniversary-timeline","Anniversary — timeline","text","paper",
    T("kicker",0.08,0.06,0.84,0.04,KICKER),
    T("title",0.08,0.12,0.84,0.11,{font:"display",size:0.075,weight:800,color:"accent"}),
    S("line","line",0.14,0.29,0.004,0.52,"accent"),
    S("dot1","ellipse",0.115,0.28,0.06,0.06,"accent"), S("dot2","ellipse",0.115,0.48,0.06,0.06,"accent"), S("dot3","ellipse",0.115,0.68,0.06,0.06,"accent"),
    T("body",0.22,0.28,0.68,0.5,{size:0.034,lh:1.65}), P("p1",0.62,0.7,0.3,0.18,{frame:"rounded"}), folio()),
  L("anniversary-letter","Anniversary — letter","text","soft",
    P("p1",0.08,0.07,0.25,0.2,{frame:"rounded"}), T("kicker",0.38,0.08,0.54,0.04,KICKER),
    T("title",0.38,0.13,0.54,0.13,{font:"display",size:0.07,weight:800}), T("body",0.08,0.33,0.84,0.47,{size:0.038,lh:1.58}),
    T("sign",0.08,0.83,0.84,0.07,{font:"display",italic:true,size:0.06,color:"accent"}), folio()),

  L("wedding-cover","Wedding — invitation cover","cover","paper",
    S("frame","line",0.06,0.06,0.88,0.004,"accent2"), S("frame2","line",0.06,0.92,0.88,0.004,"accent2"),
    T("kicker",0.12,0.1,0.76,0.04,{...KICKER,align:"center"}), T("title",0.1,0.16,0.8,0.15,{font:"display",size:0.11,weight:500,align:"center",lh:1}),
    P("p1",0.19,0.34,0.62,0.34,{frame:"border"}), T("body",0.12,0.73,0.76,0.09,{size:0.032,align:"center",lh:1.45}), T("byline",0.12,0.84,0.76,0.06,{font:"display",italic:true,size:0.05,color:"accent",align:"center"})),
  L("wedding-vows","Wedding — vows","text","paper",
    T("kicker",0.08,0.07,0.84,0.04,KICKER), T("title",0.08,0.13,0.84,0.18,{font:"display",size:0.09,weight:500,align:"center",lh:1}),
    S("rule","line",0.28,0.33,0.44,0.002,"accent2"), T("body",0.13,0.4,0.74,0.36,{size:0.038,lh:1.65,align:"center"}),
    P("p1",0.38,0.8,0.24,0.1,{frame:"rounded"}), folio()),
  L("wedding-gallery","Wedding — gallery","photo","soft",
    T("kicker",0.08,0.05,0.84,0.04,{...KICKER,align:"center"}), P("p1",0.08,0.12,0.54,0.58,{frame:"border"}), P("p2",0.65,0.12,0.27,0.27,{frame:"border"}), P("p3",0.65,0.43,0.27,0.27,{frame:"border"}),
    T("caption",0.08,0.75,0.84,0.1,{font:"display",italic:true,size:0.05,align:"center"}), folio()),

  L("friends-cover","Friends — magazine cover","cover","accent",
    T("kicker",0.07,0.05,0.86,0.04,{size:0.03,weight:700,tracking:0.14,upper:true,color:W}),
    T("title",0.07,0.11,0.86,0.22,{font:"display",size:0.17,weight:900,upper:true,color:W,lh:0.9}),
    P("p1",0.07,0.36,0.52,0.43,{frame:"rounded"}), P("p2",0.63,0.36,0.3,0.2,{frame:"rounded"}), P("p3",0.63,0.59,0.3,0.2,{frame:"rounded"}),
    T("byline",0.07,0.84,0.86,0.06,{size:0.03,weight:700,tracking:0.08,upper:true,color:W})),
  L("friends-chaos","Friends — memory spread","collage","paper",
    T("kicker",0.08,0.05,0.84,0.04,KICKER), T("title",0.08,0.11,0.84,0.12,{font:"display",size:0.08,weight:900,upper:true}),
    P("p1",0.08,0.27,0.38,0.3,{frame:"rounded"}), P("p2",0.53,0.24,0.39,0.36,{frame:"border",rot:{deg:3,cx:0.5,cy:0.5}}),
    P("p3",0.2,0.6,0.3,0.22,{frame:"border",rot:{deg:-4,cx:0.5,cy:0.5}}), T("body",0.55,0.64,0.35,0.2,{size:0.033,lh:1.5}), folio()),
  L("friends-note","Friends — note","text","soft",
    T("kicker",0.08,0.07,0.84,0.04,KICKER), T("title",0.08,0.13,0.84,0.14,{font:"display",size:0.09,weight:900}),
    P("p1",0.08,0.33,0.27,0.22,{frame:"rounded"}), T("body",0.4,0.32,0.52,0.42,{size:0.038,lh:1.58}), T("sign",0.4,0.78,0.52,0.07,{font:"display",italic:true,size:0.055,color:"accent"}), folio()),

  L("birthday-cover","Birthday — poster cover","cover","accent",
    S("circle","ellipse",0.56,0.02,0.5,0.5,"accent2",{alpha:0.25}), T("kicker",0.07,0.05,0.86,0.04,{...KICKER,color:W}),
    T("title",0.07,0.12,0.86,0.25,{font:"display",size:0.21,weight:900,upper:true,color:W,lh:0.82}),
    P("p1",0.08,0.43,0.84,0.3,{frame:"rounded"}), T("body",0.08,0.77,0.84,0.07,{size:0.034,weight:600,color:W}), T("byline",0.08,0.87,0.84,0.05,{font:"display",italic:true,size:0.05,color:W})),
  L("birthday-highlights","Birthday — highlights","collage","soft",
    T("kicker",0.08,0.05,0.84,0.04,KICKER), T("title",0.08,0.11,0.84,0.12,{font:"display",size:0.09,weight:900,color:"accent"}),
    P("p1",0.08,0.28,0.52,0.45,{frame:"rounded"}), P("p2",0.63,0.28,0.29,0.2,{frame:"border"}), P("p3",0.63,0.51,0.29,0.2,{frame:"border"}),
    T("caption",0.08,0.78,0.84,0.1,{size:0.035,lh:1.45}), folio()),
  L("birthday-letter","Birthday — letter","text","paper",
    T("title",0.08,0.07,0.84,0.15,{font:"display",size:0.095,weight:900,color:"accent"}), P("p1",0.68,0.08,0.24,0.2,{frame:"rounded"}),
    T("body",0.08,0.29,0.84,0.46,{size:0.04,lh:1.58}), T("sign",0.08,0.8,0.84,0.07,{font:"display",italic:true,size:0.06,color:"accent"}), folio()),

  L("sorry-cover","Sorry — quiet cover","cover","paper",
    T("kicker",0.08,0.09,0.84,0.04,{...KICKER,color:"accent"}), T("title",0.08,0.17,0.84,0.2,{font:"display",size:0.13,weight:700,lh:1}),
    S("rule","line",0.08,0.39,0.84,0.002,"accent2"), T("body",0.08,0.44,0.68,0.14,{size:0.038,lh:1.5}), P("p1",0.64,0.58,0.28,0.25,{frame:"rounded"}), T("byline",0.08,0.84,0.84,0.06,{font:"display",italic:true,size:0.05,color:"accent"})),
  L("sorry-letter","Sorry — honest letter","text","paper",
    T("kicker",0.08,0.07,0.84,0.04,KICKER), T("title",0.08,0.13,0.84,0.15,{font:"display",size:0.085,weight:700}), T("body",0.08,0.34,0.84,0.42,{size:0.041,lh:1.65}),
    P("p1",0.08,0.8,0.18,0.1,{frame:"rounded"}), T("sign",0.31,0.79,0.61,0.09,{font:"display",italic:true,size:0.06,color:"accent"}), folio()),
  L("sorry-change","Sorry — change page","text","soft",
    T("kicker",0.08,0.07,0.84,0.04,KICKER), T("title",0.08,0.13,0.84,0.13,{font:"display",size:0.075,weight:700,color:"accent"}), P("p1",0.08,0.3,0.38,0.43,{frame:"rounded"}),
    T("body",0.52,0.31,0.38,0.42,{size:0.033,lh:1.58}), T("sign",0.52,0.77,0.38,0.07,{font:"display",italic:true,size:0.05,color:"accent"}), folio()),

  L("memories-cover","Memories — film cover","cover","dark",
    P("p1",0,0,1,0.66), S("scrim","scrim-up",0,0.5,1,0.5,"#000",{alpha:0.7}),
    T("kicker",0.08,0.69,0.84,0.04,{...KICKER,color:"accent2"}), T("title",0.08,0.74,0.84,0.12,{font:"display",size:0.11,weight:700,color:W}),
    T("body",0.08,0.87,0.84,0.06,{size:0.03,color:W})),
  L("memories-film","Memories — film spread","collage","paper",
    T("kicker",0.07,0.05,0.86,0.04,KICKER), T("title",0.07,0.11,0.86,0.1,{font:"display",size:0.075,weight:700}),
    P("p1",0.07,0.25,0.27,0.42,{frame:"border"}), P("p2",0.365,0.25,0.27,0.42,{frame:"border"}), P("p3",0.66,0.25,0.27,0.42,{frame:"border"}),
    T("caption",0.07,0.74,0.86,0.1,{font:"display",italic:true,size:0.05,lh:1.3}), folio()),
  L("memories-note","Memories — journal note","text","soft",
    P("p1",0.08,0.08,0.34,0.35,{frame:"border"}), T("kicker",0.48,0.09,0.44,0.04,KICKER), T("title",0.48,0.14,0.44,0.15,{font:"display",size:0.07,weight:700}),
    T("body",0.08,0.5,0.84,0.3,{size:0.037,lh:1.58}), T("sign",0.08,0.84,0.84,0.06,{font:"display",italic:true,size:0.05,color:"accent"}), folio()),

  L("appreciation-cover","Appreciation — editorial cover","cover","soft",
    T("kicker",0.08,0.07,0.84,0.04,{...KICKER,color:"accent"}), T("title",0.08,0.13,0.84,0.17,{font:"display",size:0.12,weight:700,color:"ink"}),
    P("p1",0.08,0.34,0.48,0.42,{frame:"rounded"}), T("body",0.61,0.38,0.29,0.27,{size:0.034,lh:1.55}), T("byline",0.61,0.72,0.29,0.06,{font:"display",italic:true,size:0.045,color:"accent"})),
  L("appreciation-thanks","Appreciation — reasons","text","paper",
    T("title",0.08,0.07,0.84,0.12,{font:"display",size:0.08,weight:700,color:"accent"}), P("p1",0.62,0.08,0.3,0.2,{frame:"rounded"}),
    T("body",0.08,0.29,0.84,0.48,{size:0.038,lh:1.6}), T("sign",0.08,0.81,0.84,0.06,{font:"display",italic:true,size:0.05,color:"accent"}), folio()),
  L("appreciation-impact","Appreciation — impact","quote","soft",
    T("kicker",0.08,0.07,0.84,0.04,KICKER), T("quote",0.08,0.15,0.84,0.28,{font:"display",size:0.075,weight:700,lh:1.2}), P("p1",0.08,0.51,0.4,0.25,{frame:"rounded"}), T("body",0.53,0.51,0.39,0.25,{size:0.033,lh:1.5}), T("sign",0.08,0.83,0.84,0.06,{font:"display",italic:true,size:0.05,color:"accent"}), folio()),

  L("distance-cover","Long distance — postcard cover","cover","dark",
    T("kicker",0.08,0.06,0.84,0.04,{...KICKER,color:"accent2"}), T("title",0.08,0.12,0.84,0.17,{font:"display",size:0.13,weight:800,color:W}),
    P("p1",0.08,0.33,0.84,0.34,{frame:"rounded"}), S("route","line",0.18,0.73,0.64,0.004,"accent2"), S("dot1","ellipse",0.15,0.705,0.055,0.055,"accent2"), S("dot2","ellipse",0.795,0.705,0.055,0.055,"accent2"),
    T("body",0.08,0.78,0.84,0.07,{size:0.032,color:W,align:"center"}), T("byline",0.08,0.88,0.84,0.05,{font:"display",italic:true,size:0.045,color:"accent2",align:"center"})),
  L("distance-map","Long distance — route page","photo","soft",
    T("kicker",0.08,0.06,0.84,0.04,KICKER), T("title",0.08,0.12,0.84,0.1,{font:"display",size:0.07,weight:800,color:"accent"}),
    S("route","line",0.16,0.29,0.68,0.004,"accent"), S("dot1","ellipse",0.13,0.265,0.06,0.06,"accent"), S("dot2","ellipse",0.81,0.265,0.06,0.06,"accent"),
    P("p1",0.08,0.37,0.84,0.32,{frame:"rounded"}), T("body",0.08,0.74,0.84,0.1,{size:0.034,lh:1.45}), folio()),
  L("distance-countdown","Long distance — countdown","text","paper",
    T("kicker",0.08,0.07,0.84,0.04,KICKER), T("title",0.08,0.14,0.84,0.13,{font:"display",size:0.09,weight:800,color:"accent"}),
    T("body",0.08,0.31,0.55,0.35,{size:0.04,lh:1.6}), P("p1",0.65,0.31,0.27,0.3,{frame:"border"}), T("sign",0.08,0.76,0.84,0.07,{font:"display",italic:true,size:0.05,color:"accent"}), folio()),

  L("just-cover","Just Because — playful cover","cover","paper",
    S("c1","ellipse",0.69,0.04,0.2,0.2,"accent2",{alpha:0.8}), S("c2","ellipse",0.02,0.67,0.15,0.15,"accent2",{alpha:0.45}),
    T("kicker",0.08,0.08,0.84,0.04,{...KICKER,color:"accent"}), T("title",0.08,0.15,0.84,0.2,{font:"display",size:0.16,weight:800,color:"accent",lh:0.88}),
    P("p1",0.12,0.41,0.76,0.3,{frame:"rounded",shadow:true}), T("body",0.08,0.76,0.84,0.08,{size:0.032,lh:1.4}), T("byline",0.08,0.87,0.84,0.05,{font:"display",italic:true,size:0.04,color:"accent"})),
  L("just-note","Just Because — note","text","soft",
    T("kicker",0.08,0.07,0.84,0.04,KICKER), T("title",0.08,0.13,0.84,0.14,{font:"display",size:0.09,weight:800,color:"accent"}), P("p1",0.08,0.32,0.3,0.25,{frame:"rounded"}),
    T("body",0.45,0.31,0.47,0.4,{size:0.038,lh:1.58}), T("sign",0.45,0.77,0.47,0.07,{font:"display",italic:true,size:0.055,color:"accent"}), folio()),
  L("just-moments","Just Because — moments","collage","paper",
    T("kicker",0.08,0.05,0.84,0.04,KICKER), T("title",0.08,0.11,0.84,0.1,{font:"display",size:0.075,weight:800,color:"accent"}),
    P("p1",0.08,0.26,0.55,0.42,{frame:"rounded"}), P("p2",0.67,0.26,0.25,0.2,{frame:"border"}), P("p3",0.67,0.49,0.25,0.2,{frame:"border"}),
    T("caption",0.08,0.74,0.84,0.1,{font:"display",italic:true,size:0.05,lh:1.3}), folio()),

];

export const LAYOUTS: Record<string, Layout> = Object.fromEntries(LAYOUT_LIST.map((l) => [l.id, l]));
