// Offline export (task 6.1): builds ONE self-contained .html file in the browser from the creator's draft.
// Inlined: photos and voice notes as data URIs, the engine + envelope + renderer + layouts (public/offline/runtime.js), the chosen font pair as base64 woff2,
// and the gift content. The file makes no network requests. Run `npm run build:offline` (done automatically before dev and build) to make the runtime and fonts.
import type { Draft } from "./draft";
import { draftPalette } from "./draft";
import type { PageData, PhotoContent } from "./pages/types";
import { TEMPLATES, bookStyle, fill, fillPages } from "../templates";
import type { OfflineGift } from "../offline/types";

export class OfflineError extends Error {}

type FontFile = { weight: number; style: string; file: string };

const base64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf); let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const dataUri = (blob: Blob) => new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => no(r.error); r.readAsDataURL(blob); });
const getOk = async (url: string, what: string, init?: RequestInit) => {
  let res: Response;
  try { res = await fetch(url, init); } catch { throw new OfflineError(`${what} could not be loaded. Check your connection and try again.`); }
  if (!res.ok) throw new OfflineError(`${what} could not be loaded (${res.status}).`);
  return res;
};
/** First family name of a CSS font-family string, without quotes. */
const family = (css: string) => css.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const AUDIO_MIME_BY_EXT: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav" };
const GENERIC_TYPES = /^(application|binary)\/octet-stream$|^$/;

/**
 * The audio type to store a fetched voice note under (task 10.2b), or null if it is not audio.
 * Cloudinary may serve a note as video/x-m4a, video/quicktime or a generic type, so when the type is not plainly audio
 * the file extension of the URL decides. The result is always one of the four formats the app allows, so phones can play it.
 */
export function noteMime(type: string, url: string): string | null {
  const ext = /\.([a-z0-9]+)(?:[?#].*)?$/i.exec(url)?.[1]?.toLowerCase() ?? "";
  const byExt = AUDIO_MIME_BY_EXT[ext];
  const t = type.toLowerCase().split(";")[0].trim();
  if (t.startsWith("audio/") || t === "video/mp4" || t === "video/x-m4a" || t === "video/quicktime" || GENERIC_TYPES.test(t)) return byExt ?? (t.startsWith("audio/") ? t : null);
  return null;
}

/** Replaces every https voice note with a data URI so the file plays with no network (task 8.7). Throws if one cannot be fetched. */
export async function inlineAudio(pages: PageData[]): Promise<PageData[]> {
  const cache = new Map<string, Promise<string>>();
  const grab = (src: string) => {
    if (!cache.has(src)) cache.set(src, (async () => {
      const blob = await (await getOk(src, "A voice note", { mode: "cors" })).blob();
      const mime = noteMime(blob.type, src);
      if (!mime) throw new OfflineError("A voice note is not an audio file, so it cannot be saved in the file.");
      return dataUri(new Blob([blob], { type: mime })); // stored under a type phones can play, whatever the server called it
    })());
    return cache.get(src)!;
  };
  return Promise.all(pages.map(async (p): Promise<PageData> =>
    p.audio && /^https?:/i.test(p.audio.src) ? { ...p, audio: { ...p.audio, src: await grab(p.audio.src) } } : p));
}

/** How many pages carry a voice note (the Send popup warns that each one makes the file bigger). */
export const audioCount = (draft: Draft): number => draft.pages.filter((p) => p.audio).length;

/** Replaces every https photo with a data URI (sample:N and data: photos stay as they are). Throws if one cannot be fetched. */
export async function inlinePhotos(pages: PageData[]): Promise<PageData[]> {
  const cache = new Map<string, Promise<string>>();
  const grab = (src: string) => {
    if (!cache.has(src)) cache.set(src, (async () => {
      const blob = await (await getOk(src, "A photo", { mode: "cors" })).blob();
      if (!blob.type.startsWith("image/")) throw new OfflineError("A photo is not a picture, so it cannot be saved in the file.");
      return dataUri(blob);
    })());
    return cache.get(src)!;
  };
  return Promise.all(pages.map(async (p): Promise<PageData> => {
    const slots: PageData["slots"] = {};
    for (const [k, v] of Object.entries(p.slots)) {
      if (typeof v === "string") { slots[k] = v; continue; }
      const photo: PhotoContent = { ...v };
      if (photo.src && /^https?:/i.test(photo.src)) photo.src = await grab(photo.src);
      slots[k] = photo;
    }
    return { ...p, slots };
  }));
}

async function fontCss(families: string[]): Promise<string> {
  const manifest: Record<string, FontFile[]> = await (await getOk("/offline/fonts/manifest.json", "The font list")).json();
  const css: string[] = [];
  for (const fam of new Set(families)) {
    for (const f of manifest[fam] ?? []) {
      const b64 = base64(await (await getOk(`/offline/fonts/${f.file}`, "A font")).arrayBuffer());
      css.push(`@font-face{font-family:'${fam}';font-style:${f.style};font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`);
    }
  }
  return css.join("\n");
}

const PAGE_CSS = `html,body{margin:0;height:100%;background:#1c1917;overflow:hidden;overscroll-behavior:none}
#app{position:fixed;inset:0;height:100dvh;overflow:hidden;color:#f5f5f4;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#1c1917}
.fbo-root{position:relative;width:100%;height:100%}.fbo-stage{position:absolute;inset:0}
.fbo-bar{position:absolute;z-index:10;display:flex;gap:8px;top:max(.75rem,env(safe-area-inset-top));right:max(.75rem,env(safe-area-inset-right))}
.fbo-btn{font:600 14px system-ui,sans-serif;min-width:44px;height:44px;padding:0 14px;border:0;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.fbo-x{font-size:20px;padding:0}.fbo-btn:focus-visible,.fbo-again:focus-visible{outline:2px solid #fff;outline-offset:2px}
.fbo-screen{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;background:#1c1917}
.fbo-title{margin:0;font-size:24px}.fbo-text{margin:0;max-width:24em;font-size:18px;color:#e7e5e4}
.fbo-again{font:600 16px system-ui,sans-serif;min-height:48px;padding:0 24px;border:0;border-radius:999px;background:#f5f5f4;color:#1c1917;cursor:pointer}`;

/** Builds the offline file's text. Throws OfflineError with a plain message if something needed could not be loaded. */
export async function buildOfflineHtml(draft: Draft): Promise<string> {
  const template = TEMPLATES[draft.templateId];
  if (!template) throw new OfflineError("This gift's template is unknown, so it cannot be saved.");
  const style = bookStyle(template, draft.fontPair, draftPalette(draft));
  const names = { to: draft.to.trim() || "you", from: draft.from.trim() || "me" };
  const gift: OfflineGift = {
    to: names.to, from: names.from,
    message: draft.invitation ?? fill(template.invitation, names),
    style, pages: await inlineAudio(await inlinePhotos(fillPages(draft.pages, names))),
  };
  const runtime = await (await getOk("/offline/runtime.js", "The player")).text();
  const fonts = await fontCss([family(style.fonts.display), family(style.fonts.body)]);
  const json = JSON.stringify(gift).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const js = runtime.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex"><meta name="referrer" content="no-referrer">
<title>${esc("A gift for " + names.to)}</title>
<style>${fonts}\n${PAGE_CSS}</style></head><body>
<main id="app"></main>
<noscript><p style="color:#fff;padding:24px;font-family:sans-serif">This gift needs JavaScript to open.</p></noscript>
<script type="application/json" id="gift">${json}</script>
<script>${js}</script>
</body></html>`;
}

export const offlineFileName = (to: string) => "gift-for-" + (to.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "you") + ".html";

/** Builds the file and starts the browser download. */
export async function downloadOffline(draft: Draft): Promise<number> {
  const html = await buildOfflineHtml(draft);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = offlineFileName(draft.to);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return blob.size; // bytes, so the popup can say how big the file is
}
