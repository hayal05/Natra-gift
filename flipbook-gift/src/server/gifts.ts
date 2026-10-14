// Gift logic for the backend (task 4.1): tokens, input checks and the store interface. No framework or database imports,
// so it is tested with an in-memory store (`scripts/test-gifts.ts`). Task 4.3 deepens the validation.
// The creator keeps a secret EDIT token (only its hash is stored); the recipient link uses a separate PRIVATE token.
import { createHash, randomBytes } from "node:crypto";
import type { Draft } from "../lib/draft";
import { MAX_EXTRAS, editableSlots, textLimit } from "../lib/editor";
import type { EditableSlot } from "../lib/editor";
import { pageSlots } from "../lib/pages/render";
import { isFontId } from "../lib/pages/fontlist";
import type { ExtraSlotDef, Layout, PageData, PhotoContent, Rot, TextStyle } from "../lib/pages";
import { LIMITS } from "../lib/draft";
import { LAYOUTS, TEMPLATES } from "../templates";

export const MAX_BODY_BYTES = 4_000_000; // photos are normally URLs; this also covers drafts that still hold shrunk data-URI photos

export interface GiftRow {
  id: string;
  editTokenHash: string;
  privateToken: string;
  recipientName: string;
  senderName: string;
  templateId: string;
  content: Draft;
  status: "published";
  createdAt: Date;
}

export interface GiftStore {
  insert(row: GiftRow): Promise<void>;
  byEditHash(hash: string): Promise<GiftRow | null>;
  byPrivateToken(token: string): Promise<GiftRow | null>;
  /** Replace the content and names of the gift owning this edit hash. Returns false if there is none. */
  update(hash: string, patch: Pick<GiftRow, "recipientName" | "senderName" | "templateId" | "content">): Promise<boolean>;
}

export const newToken = () => randomBytes(24).toString("base64url");
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
export const isToken = (t: unknown): t is string => typeof t === "string" && TOKEN_RE.test(t);

const PHOTO_SRC = /^(sample:[1-9]\d{0,2}|https:\/\/[^\s"'<>]{1,500}|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/;
const AUDIO_SRC = /^https:\/\/res\.cloudinary\.com\/([A-Za-z0-9_-]{1,64})\/video\/upload\/[^\s"'<>]{1,500}$/; // audio is stored by Cloudinary as "video"
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F]/g; // control characters (a newline is kept)
const clean = (s: string) => s.replace(CONTROL, "");
const PALETTE_KEYS = ["paper", "ink", "accent", "accent2", "soft", "dark"];
const oneOf = (v: unknown, list: string[]) => typeof v === "string" && list.includes(v);
const inRange = (v: unknown, lo: number, hi: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

const EXTRA_ID = /^x[0-9]{1,3}$/; // ids of added components: x1, x2, ...
const HEX = /^#[0-9a-fA-F]{3,8}$/; // a literal colour a copied layout component may carry (for example #fff)
const colorOk = (v: unknown) => oneOf(v, PALETTE_KEYS) || (typeof v === "string" && HEX.test(v));

/** One component the creator added (task 10.4c), rebuilt from known fields only. Returns the clean definition or a message. */
function checkExtra(e: unknown, layout: Layout, seen: Set<string>): ExtraSlotDef | string {
  const bad = "An added item is not valid.";
  if (!isObj(e) || typeof e.id !== "string" || !EXTRA_ID.test(e.id) || seen.has(e.id) || layout.slots.some((s) => s.id === e.id)) return bad;
  if (e.kind !== "text" && e.kind !== "photo") return bad;
  const box = { x: e.x, y: e.y, w: e.w, h: e.h };
  if (!inRange(box.x, 0, 1) || !inRange(box.y, 0, 1) || !inRange(box.w, 0.02, 1) || !inRange(box.h, 0.02, 1)) return bad;
  const base = { id: e.id, x: box.x, y: box.y, w: box.w, h: box.h };
  let rot: Rot | undefined;
  if (e.rot !== undefined) {
    if (!isObj(e.rot) || !inRange(e.rot.deg, -45, 45) || !inRange(e.rot.cx, 0, 1) || !inRange(e.rot.cy, 0, 1)) return bad;
    rot = { deg: e.rot.deg, cx: e.rot.cx, cy: e.rot.cy };
  }
  if (e.kind === "photo") {
    const d: ExtraSlotDef = { ...base, kind: "photo" };
    if (rot) d.rot = rot;
    if (e.frame !== undefined) { if (!oneOf(e.frame, ["none", "border", "rounded"])) return bad; d.frame = e.frame as "none" | "border" | "rounded"; }
    if (e.matBottom !== undefined) { if (!inRange(e.matBottom, 0, 0.4)) return bad; d.matBottom = e.matBottom; }
    if (e.shadow !== undefined) { if (typeof e.shadow !== "boolean") return bad; d.shadow = e.shadow; }
    return d;
  }
  if (!oneOf(e.font, ["display", "body"]) || !inRange(e.size, 0.01, 0.4) || !colorOk(e.color)) return bad;
  const t: ExtraSlotDef = { ...base, kind: "text", font: e.font as "display" | "body", size: e.size as number, color: e.color as string };
  if (rot) t.rot = rot;
  if (e.family !== undefined) { if (!isFontId(e.family)) return bad; t.family = e.family; } // a registry id only (task 11.2f)
  if (e.weight !== undefined) { if (!inRange(e.weight, 100, 900)) return bad; t.weight = e.weight; }
  if (e.tracking !== undefined) { if (!inRange(e.tracking, -0.1, 0.5)) return bad; t.tracking = e.tracking; }
  if (e.lh !== undefined) { if (!inRange(e.lh, 0.5, 3)) return bad; t.lh = e.lh; }
  for (const k of ["italic", "upper"] as const) if (e[k] !== undefined) { if (typeof e[k] !== "boolean") return bad; t[k] = e[k] as boolean; }
  if (e.align !== undefined) { if (!oneOf(e.align, ["left", "center", "right", "justify"])) return bad; t.align = e.align as "left" | "center" | "right" | "justify"; }
  if (e.valign !== undefined) { if (!oneOf(e.valign, ["top", "middle", "bottom"])) return bad; t.valign = e.valign as "top" | "middle" | "bottom"; }
  if (e.hint !== undefined) { if (typeof e.hint !== "string" || e.hint.length > 60) return bad; t.hint = clean(e.hint); }
  return t; // `auto` and fixed `text` are not accepted: an added box is always a plain editable text
}

export interface CheckOptions { /** Cloudinary cloud name: when set, `https://` photos and audio notes must come from that account. */ cloud?: string }
type Checked = { ok: true; draft: Draft } | { ok: false; message: string };

/** One page, rebuilt from known fields only: slots the layout defines, values of the right kind, presets in range. */
function checkPage(p: unknown, opts: CheckOptions): { ok: true; page: PageData } | { ok: false; message: string } {
  const bad = (message: string) => ({ ok: false as const, message });
  if (!isObj(p) || typeof p.layout !== "string" || !LAYOUTS[p.layout] || !isObj(p.slots)) return bad("A page is not valid.");
  const layout = LAYOUTS[p.layout];
  let extras: ExtraSlotDef[] | undefined;
  if (p.extras !== undefined) { // components the creator added: at most MAX_EXTRAS, each rebuilt from known fields
    if (!Array.isArray(p.extras) || p.extras.length > MAX_EXTRAS) return bad(`A page can hold up to ${MAX_EXTRAS} added items.`);
    const seen = new Set<string>(); extras = [];
    for (const e of p.extras) { const r = checkExtra(e, layout, seen); if (typeof r === "string") return bad(r); seen.add(r.id); extras.push(r); }
    if (!extras.length) extras = undefined;
  }
  const defs: EditableSlot[] = [...editableSlots(layout), ...(extras ?? [])]; // content and styles of added items are kept under their ids
  const slots: PageData["slots"] = {};
  for (const d of defs) { // slots the layout does not define (left over from a layout swap) are dropped
    const v = p.slots[d.id];
    if (v === undefined) continue;
    if (d.kind === "text") {
      if (typeof v !== "string") return bad("A text is not valid.");
      if (v.length > textLimit(d)) return bad("A text is too long.");
      slots[d.id] = clean(v);
    } else {
      const added = !!extras?.some((x) => x.id === d.id); // an added photo may still be empty (a placeholder), as the editor creates it
      if (!isObj(v) || typeof v.src !== "string" || !(PHOTO_SRC.test(v.src) || (added && v.src === ""))) return bad("A photo is not valid.");
      if (v.src.startsWith("https://") && opts.cloud && !v.src.startsWith(`https://res.cloudinary.com/${opts.cloud}/`)) return bad("A photo is not from our uploads.");
      const ph: PhotoContent = { src: v.src };
      for (const [k, lo, hi] of [["x", 0, 0.9], ["y", 0, 0.9], ["w", 0.1, 1], ["h", 0.1, 1]] as const) if (v[k] !== undefined) { if (!inRange(v[k], lo, hi)) return bad("A photo setting is not valid."); ph[k] = v[k] as number; } // the photo's own box, as `setPhoto` keeps it
      for (const k of ["panX", "panY"] as const) if (v[k] !== undefined) { if (!inRange(v[k], -1, 1)) return bad("A photo setting is not valid."); ph[k] = v[k] as number; }
      if (v.zoom !== undefined) { if (!inRange(v.zoom, 1, 3)) return bad("A photo setting is not valid."); ph.zoom = v.zoom as number; }
      if (v.fit !== undefined) { if (!oneOf(v.fit, ["fill", "fit"])) return bad("A photo setting is not valid."); ph.fit = v.fit as PhotoContent["fit"]; }
      if (v.filter !== undefined) { if (!oneOf(v.filter, ["none", "warm", "bw"])) return bad("A photo setting is not valid."); ph.filter = v.filter as PhotoContent["filter"]; }
      if (v.frame !== undefined) { if (!oneOf(v.frame, ["none", "border", "rounded"])) return bad("A photo setting is not valid."); ph.frame = v.frame as PhotoContent["frame"]; }
      slots[d.id] = ph;
    }
  }
  const page: PageData = { layout: p.layout, slots };
  if (extras) page.extras = extras;
  if (p.hidden !== undefined) { // layout components the creator deleted: known editable ids only, and the page keeps a photo
    if (!Array.isArray(p.hidden) || p.hidden.length > 32) return bad("A deleted item is not valid.");
    const own = editableSlots(layout).map((d) => d.id), ids: string[] = [];
    for (const id of p.hidden) { if (typeof id !== "string" || !own.includes(id) || ids.includes(id)) return bad("A deleted item is not valid."); ids.push(id); }
    if (ids.length) {
      if (!pageSlots(layout, { hidden: ids, extras }).some((d) => d.kind === "photo")) return bad("Every page needs at least one photo.");
      page.hidden = ids;
    }
  }
  if (p.bg !== undefined) { if (!oneOf(p.bg, PALETTE_KEYS)) return bad("A page colour is not valid."); page.bg = p.bg as PageData["bg"]; }
  if (p.audio !== undefined) {
    const m = isObj(p.audio) && typeof p.audio.src === "string" ? AUDIO_SRC.exec(p.audio.src) : null;
    if (!isObj(p.audio) || !m) return bad("An audio note is not valid.");
    if (opts.cloud && m[1] !== opts.cloud) return bad("An audio note is not from our uploads.");
    if (!inRange(p.audio.duration, 1, 180)) return bad("An audio note duration is not valid.");
    page.audio = { src: p.audio.src as string, duration: Math.round(p.audio.duration) };
  }
  if (p.styles !== undefined) {
    if (!isObj(p.styles)) return bad("A text style is not valid.");
    const styles: Record<string, TextStyle> = {};
    for (const d of defs) {
      const st = p.styles[d.id];
      if (st === undefined || d.kind !== "text") continue;
      if (!isObj(st)) return bad("A text style is not valid.");
      const o: TextStyle = {};
      if (st.font !== undefined) { if (!oneOf(st.font, ["display", "body"])) return bad("A text style is not valid."); o.font = st.font as TextStyle["font"]; }
      if (st.family !== undefined) { if (!isFontId(st.family)) return bad("A text style is not valid."); o.family = st.family; } // a registry id only (task 11.2f)
      if (st.size !== undefined) { if (!oneOf(st.size, ["S", "M", "L"])) return bad("A text style is not valid."); o.size = st.size as TextStyle["size"]; }
      if (st.align !== undefined) { if (!oneOf(st.align, ["left", "center", "right", "justify"])) return bad("A text style is not valid."); o.align = st.align as TextStyle["align"]; }
      for (const k of ["bold", "italic"] as const) { if (st[k] === undefined) continue; if (typeof st[k] !== "boolean") return bad("A text style is not valid."); o[k] = st[k] as boolean; }
      if (st.color !== undefined) { if (!oneOf(st.color, PALETTE_KEYS)) return bad("A text style is not valid."); o.color = st.color as TextStyle["color"]; }
      // Numbers are clamped into range instead of refused: a box dragged near the page edge and then resized can land a hair outside
      // (for example scale 0.389), and refusing it blocked the whole publish. Only a non-number (null, NaN, text) is dropped.
      for (const [k, lo, hi] of [["x", -0.45, 0.45], ["y", -0.45, 0.45], ["scale", 0.4, 4], ["w", 0.1, 1]] as const) {
        const v = st[k];
        if (v === undefined || v === null) continue;
        if (typeof v !== "number" || !Number.isFinite(v)) continue;
        o[k] = Math.min(hi, Math.max(lo, v));
      }
      styles[d.id] = o;
    }
    if (Object.keys(styles).length) page.styles = styles;
  }
  return { ok: true, page };
}

/** Checks a draft sent by the browser and rebuilds it from known fields only. Returns the clean draft or a message. */
export function checkDraft(body: unknown, opts: CheckOptions = { cloud: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || undefined }): Checked {
  const bad = (message: string) => ({ ok: false as const, message });
  if (!isObj(body) || body.v !== 1) return bad("This is not a gift.");
  if (typeof body.templateId !== "string" || !TEMPLATES[body.templateId]) return bad("Unknown template.");
  const name = (v: unknown) => (typeof v === "string" ? clean(v).trim() : "");
  const to = name(body.to), from = name(body.from);
  if (!to || !from) return bad("Both names are needed.");
  if (to.length > LIMITS.name || from.length > LIMITS.name) return bad("A name is too long.");
  const inv = body.invitation;
  if (inv !== null && (typeof inv !== "string" || inv.length > LIMITS.invitation)) return bad("The envelope message is too long.");
  if (body.fontPair !== 0 && body.fontPair !== 1) return bad("Unknown font pair.");
  const paletteId = body.paletteId;
  if (paletteId !== undefined && (typeof paletteId !== "string" || !TEMPLATES[paletteId])) return bad("Unknown colour scheme.");
  if (!Array.isArray(body.pages) || body.pages.length < 4 || body.pages.length > 16) return bad("A book needs 4 to 16 pages.");
  const pages: PageData[] = [];
  for (const p of body.pages) { const r = checkPage(p, opts); if (!r.ok) return r; pages.push(r.page); }
  const draft: Draft = { v: 1, templateId: body.templateId, to, from, invitation: inv === null ? null : clean(inv), fontPair: body.fontPair, pages };
  if (paletteId !== undefined && paletteId !== body.templateId) draft.paletteId = paletteId;
  if (JSON.stringify(draft).length > MAX_BODY_BYTES) return bad("This gift is too big. Try fewer or smaller photos."); // the routes cap the request; this keeps the stored gift under the same limit
  return { ok: true, draft };
}

export interface Created { giftUrl: string; editUrl: string }

/** Publishing = storing the finished draft. Drafts live in the browser until now (no server-side drafts). */
export async function createGift(store: GiftStore, body: unknown, site: string): Promise<{ ok: true; value: Created } | { ok: false; status: number; message: string }> {
  const c = checkDraft(body);
  if (!c.ok) return { ok: false, status: 400, message: c.message };
  const editToken = newToken(), privateToken = newToken();
  await store.insert({ id: newToken().slice(0, 16), editTokenHash: hashToken(editToken), privateToken, recipientName: c.draft.to, senderName: c.draft.from, templateId: c.draft.templateId, content: c.draft, status: "published", createdAt: new Date() });
  return { ok: true, value: { giftUrl: `${site}/g/${privateToken}`, editUrl: `${site}/create?edit=${editToken}` } };
}

/** Reading for editing: the edit token is the only key. The recipient (private) token never matches here. */
export async function loadForEdit(store: GiftStore, editToken: unknown): Promise<Draft | null> {
  if (!isToken(editToken)) return null;
  return (await store.byEditHash(hashToken(editToken)))?.content ?? null;
}

export async function updateGift(store: GiftStore, editToken: unknown, body: unknown): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!isToken(editToken)) return { ok: false, status: 403, message: "This edit link is not valid." };
  const c = checkDraft(body);
  if (!c.ok) return { ok: false, status: 400, message: c.message };
  const done = await store.update(hashToken(editToken), { recipientName: c.draft.to, senderName: c.draft.from, templateId: c.draft.templateId, content: c.draft });
  return done ? { ok: true } : { ok: false, status: 403, message: "This edit link is not valid." };
}

/** What the recipient page may see (task 4.2 serves it): content only, never the edit hash. */
export async function loadForRecipient(store: GiftStore, privateToken: unknown): Promise<Draft | null> {
  if (!isToken(privateToken)) return null;
  return (await store.byPrivateToken(privateToken))?.content ?? null;
}

/** In-memory store for tests. */
export function memoryStore(): GiftStore {
  const rows: GiftRow[] = [];
  return {
    async insert(r) { rows.push(structuredClone(r)); },
    async byEditHash(h) { return structuredClone(rows.find((r) => r.editTokenHash === h) ?? null); },
    async byPrivateToken(t) { return structuredClone(rows.find((r) => r.privateToken === t) ?? null); },
    async update(h, patch) { const r = rows.find((x) => x.editTokenHash === h); if (!r) return false; Object.assign(r, structuredClone(patch)); return true; },
  };
}
