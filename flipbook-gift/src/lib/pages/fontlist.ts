// Font registry (task 11.2b): the ONE fixed list of fonts a creator can pick for a text component.
// Pure data and helpers, no font files and no React. A registry id is stored in `TextStyle.family` (11.2c);
// the two theme roles ("Headline font", "Reading font") are NOT registry entries, they are the fallback.
import type { FontRole } from "./types";
import { CUSTOM_FONTS } from "./custom-fonts";

export type FontCategory = "Serif" | "Sans" | "Display" | "Ethiopic";

export interface FontEntry {
  /** Stable id stored in gifts. Never rename one that has shipped. */
  id: string;
  /** Name shown in the picker, written in its own face. */
  label: string;
  /** First CSS family name, exactly as the @font-face / fontsource rule declares it. */
  family: string;
  category: FontCategory;
  /** Weights that really exist (400, 600, 700, 800, 900 are the ones the renderer asks for). */
  weights: readonly number[];
  /** True when a real italic 400 exists. */
  italic: boolean;
  /** Owner-supplied font served from /fonts (11.3). Its picker row uses the tiny name subset `'<family> Name'` when it has one. */
  custom?: boolean;
  hasNameFace?: boolean;
}

const f = (id: string, label: string, category: FontCategory, weights: number[], italic: boolean): FontEntry =>
  ({ id, label, family: label, category, weights, italic });

const W5 = [400, 600, 700, 800, 900];

/** Placeholder entries: the 20 families the app already ships. Custom fonts are added in 11.3, once licences are cleared. */
const SHIPPED: readonly FontEntry[] = [
  f("abril-fatface", "Abril Fatface", "Display", [400], false),
  f("archivo-black", "Archivo Black", "Display", [400], false),
  f("dm-serif-display", "DM Serif Display", "Display", [400], true),
  f("italiana", "Italiana", "Display", [400], false),
  f("cormorant-garamond", "Cormorant Garamond", "Serif", [400, 600, 700], true),
  f("libre-baskerville", "Libre Baskerville", "Serif", [400, 600, 700], true),
  f("lora", "Lora", "Serif", [400, 600, 700], true),
  f("playfair-display", "Playfair Display", "Serif", W5, true),
  f("dm-sans", "DM Sans", "Sans", W5, true),
  f("fredoka", "Fredoka", "Sans", [400, 600, 700], false),
  f("inter", "Inter", "Sans", W5, true),
  f("jost", "Jost", "Sans", W5, true),
  f("lato", "Lato", "Sans", [400, 700, 900], true),
  f("montserrat", "Montserrat", "Sans", W5, true),
  f("nunito", "Nunito", "Sans", W5, true),
  f("open-sans", "Open Sans", "Sans", [400, 600, 700, 800], true),
  f("poppins", "Poppins", "Sans", W5, true),
  f("source-sans-3", "Source Sans 3", "Sans", W5, true),
  f("space-grotesk", "Space Grotesk", "Sans", [400, 600, 700], false),
  f("work-sans", "Work Sans", "Sans", W5, true),
];

/** The shipped families plus the attached custom fonts (src/lib/pages/custom-fonts.ts). */
export const FONT_LIST: readonly FontEntry[] = [
  ...SHIPPED,
  ...CUSTOM_FONTS.map((c): FontEntry => ({ id: c.id, label: c.label, family: c.family, category: c.category, weights: [c.weight], italic: false, custom: true, hasNameFace: !!c.nameFile })),
];

export const FONT_CATEGORIES: readonly FontCategory[] = ["Serif", "Sans", "Display", "Ethiopic"];

const BY_ID = new Map(FONT_LIST.map((e) => [e.id, e]));

/** The entry for a registry id, or undefined for anything else (unknown, empty, not a string). */
export function fontById(id: unknown): FontEntry | undefined {
  return typeof id === "string" ? BY_ID.get(id) : undefined;
}

export const isFontId = (id: unknown): id is string => fontById(id) !== undefined;

const FALLBACK: Record<FontCategory, string> = {
  Serif: "Georgia, serif",
  Display: "Georgia, serif",
  Sans: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  Ethiopic: "'Noto Sans Ethiopic', 'Nyala', system-ui, sans-serif",
};

/** Full CSS font-family string for an entry, with a fallback stack. */
export const cssFamily = (e: FontEntry) => `'${e.family}', ${FALLBACK[e.category]}`;

/** CSS family for the picker row: a custom font uses its tiny name-only subset, so opening the list never downloads whole fonts. */
export const nameCss = (e: FontEntry) => (e.custom ? (e.hasNameFace ? `'${e.family} Name', ${FALLBACK[e.category]}` : FALLBACK[e.category]) : cssFamily(e));

/**
 * Which CSS family to draw with: the registry font when the id is known, else the theme role's own family.
 * An unknown id (a gift from a newer app, a removed font) therefore still draws, in the role font.
 */
export function resolveFamily(id: unknown, roleFamily: string): string {
  const e = fontById(id);
  return e ? cssFamily(e) : roleFamily;
}

/**
 * The weight to ask the browser for: the heaviest real weight not above `want`; if `want` is lighter than every
 * real weight, the lightest one. Never returns a weight the font lacks, so the browser cannot fake a wider bold
 * than the measured text (the clipping bug `displayMaxWeight` fixed for theme fonts).
 */
export function capWeight(e: FontEntry, want: number): number {
  const ws = [...e.weights].sort((a, b) => a - b);
  let best = ws[0];
  for (const w of ws) if (w <= want) best = w;
  return best;
}

/** Entries grouped by category in picker order; empty groups are left out. */
export function fontGroups(): { category: FontCategory; fonts: FontEntry[] }[] {
  return FONT_CATEGORIES.map((category) => ({ category, fonts: FONT_LIST.filter((e) => e.category === category) }))
    .filter((g) => g.fonts.length > 0);
}

/** Search for the picker (shown when the list is longer than SEARCH_MIN): case-insensitive match on label or category. */
export const SEARCH_MIN = 12;
export function searchFonts(q: string): FontEntry[] {
  const s = q.trim().toLowerCase();
  return s ? FONT_LIST.filter((e) => e.label.toLowerCase().includes(s) || e.category.toLowerCase().startsWith(s)) : [...FONT_LIST];
}

/** Role helper for callers that only have a role: kept here so 11.2c has one import. */
export const ROLE_LABEL: Record<FontRole, string> = { display: "Headline font", body: "Reading font" };
