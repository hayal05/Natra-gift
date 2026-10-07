// The creator's draft, kept in localStorage until the first upload or publish (task 3.1).
// Pages keep their {to}/{from} tokens, so changing a name updates every sample text the creator has not rewritten.
import type { PageData, Palette } from "./pages/types";
import { TEMPLATES, TEMPLATE_LIST } from "../templates";

export interface Draft {
  v: 1;
  templateId: string;
  to: string;
  from: string;
  /** null = use the template's suggested message (follows the names); a string = the creator wrote their own. */
  invitation: string | null;
  fontPair: 0 | 1;
  /** Book style preset (3.7): the id of the template whose colours the book uses. Missing = the template's own. */
  paletteId?: string;
  pages: PageData[];
}

/** The colour schemes a creator can pick: the ten template palettes, so every one is already tuned to the layouts. */
export const PALETTE_PRESETS: { id: string; name: string; palette: Palette }[] = TEMPLATE_LIST.map((t) => ({ id: t.id, name: t.name, palette: t.palette }));

/** The palette a draft uses when it is not the template's own; undefined = the template's own. */
export const draftPalette = (d: Pick<Draft, "paletteId">): Palette | undefined => (d.paletteId ? TEMPLATES[d.paletteId]?.palette : undefined);

export const LIMITS = { name: 40, invitation: 200 };
const KEY = "flipbook:draft";

export function newDraft(templateId: string, keep?: { to: string; from: string }): Draft | null {
  const t = TEMPLATES[templateId];
  if (!t) return null;
  return { v: 1, templateId, to: keep?.to ?? "", from: keep?.from ?? "", invitation: null, fontPair: 0, pages: structuredClone(t.pages) };
}

export function loadDraft(): Draft | null {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const ok = d && d.v === 1 && TEMPLATES[d.templateId] && Array.isArray(d.pages) && d.pages.length > 0
      && typeof d.to === "string" && typeof d.from === "string" && (d.invitation === null || typeof d.invitation === "string");
    if (!ok) return null;
    if (d.fontPair !== 0 && d.fontPair !== 1) d.fontPair = 0;
    if (d.paletteId !== undefined && (typeof d.paletteId !== "string" || !TEMPLATES[d.paletteId] || d.paletteId === d.templateId)) delete d.paletteId;
    return d as Draft;
  } catch { return null; }
}

/** Returns false if the browser refused (private mode, full storage) so the screen can say so. */
export function saveDraft(d: Draft): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch { return false; }
}
