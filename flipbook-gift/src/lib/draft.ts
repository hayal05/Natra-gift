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
// Each template gets its own draft. The old single-key draft is read for migration only.
const LEGACY_KEY = "flipbook:draft";
const KEY_PREFIX = "flipbook:draft:";
const STEP_PREFIX = "flipbook:step:";
const LAST_TEMPLATE = "flipbook:last-template";
const draftKey = (id: string) => KEY_PREFIX + id;

export function loadLastTemplateId(): string | null {
  try {
    const id = localStorage.getItem(LAST_TEMPLATE);
    if (id && TEMPLATES[id]) return id;
    const old = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "null") as Draft | null;
    return old?.templateId && TEMPLATES[old.templateId] ? old.templateId : null;
  } catch { return null; }
}

/** Remember whether the creator had reached page editing (separate from public gift data). */
export function loadDraftStep(templateId: string): "names" | "pages" {
  try { return localStorage.getItem(STEP_PREFIX + templateId) === "pages" ? "pages" : "names"; }
  catch { return "names"; }
}
export function saveDraftStep(templateId: string, step: "names" | "pages"): void {
  try { localStorage.setItem(STEP_PREFIX + templateId, step); } catch { /* draft saving reports storage failures elsewhere */ }
}

export function newDraft(templateId: string, keep?: { to: string; from: string }): Draft | null {
  const t = TEMPLATES[templateId];
  if (!t) return null;
  return { v: 1, templateId, to: keep?.to ?? "", from: keep?.from ?? "", invitation: null, fontPair: 0, pages: structuredClone(t.pages) };
}

function parseDraft(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const d: Draft = JSON.parse(raw);
    const ok = d && d.v === 1 && !!TEMPLATES[d.templateId] && Array.isArray(d.pages) && d.pages.length > 0
      && typeof d.to === "string" && typeof d.from === "string" && (d.invitation === null || typeof d.invitation === "string");
    if (!ok) return null;
    if (d.fontPair !== 0 && d.fontPair !== 1) d.fontPair = 0;
    if (d.paletteId !== undefined && (typeof d.paletteId !== "string" || !TEMPLATES[d.paletteId] || d.paletteId === d.templateId)) delete d.paletteId;
    return d;
  } catch { return null; }
}

/** Retrieve a particular template's own saved draft, or the most recently edited one. */
export function loadDraft(templateId?: string): Draft | null {
  try {
    const id = templateId ?? loadLastTemplateId();
    if (!id || !TEMPLATES[id]) return null;
    const saved = parseDraft(localStorage.getItem(draftKey(id)));
    if (saved?.templateId === id) return saved;
    // Existing users retain their draft from the original single-slot implementation.
    const old = parseDraft(localStorage.getItem(LEGACY_KEY));
    return old?.templateId === id ? old : null;
  } catch { return null; }
}

/** Save only to the selected template; never overwrite a draft from a different template. */
export function saveDraft(d: Draft): boolean {
  if (!TEMPLATES[d.templateId]) return false;
  try {
    localStorage.setItem(draftKey(d.templateId), JSON.stringify(d));
    localStorage.setItem(LAST_TEMPLATE, d.templateId);
    // Once migrated, remove the legacy copy to avoid duplicate storage usage.
    const legacy = parseDraft(localStorage.getItem(LEGACY_KEY));
    if (legacy?.templateId === d.templateId) localStorage.removeItem(LEGACY_KEY);
    return true;
  } catch { return false; }
}
