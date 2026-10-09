"use client";
// Send popup (task 3.9): one tap publishes, copies the link and opens the share sheet; the edit link is shown once.
// Nothing here claims success unless the publisher returned it. Download offline (6.1) builds the self-contained file from the draft, so it works without publishing.
import { useEffect, useRef, useState } from "react";
import type { Draft } from "../lib/draft";
import { OfflineError, audioCount, downloadOffline, offlineFontBytes, offlineFontFamilies } from "../lib/offline";
import { PUBLISH_ENABLED, countSamples, countEmptyPhotos, type Publisher } from "../lib/publish";

type Done = { giftUrl: string; editUrl: string; copied: boolean; shared: boolean };
const btn = "rounded-full px-5 py-2.5 text-sm font-bold";

export default function PublishDialog({ draft, publish, enabled = PUBLISH_ENABLED, onClose }: { draft: Draft; publish: Publisher; enabled?: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [note, setNote] = useState("");
  const close = useRef<HTMLButtonElement>(null);
  const [offline, setOffline] = useState<"idle" | "busy" | "done">("idle");
  const [offlineSize, setOfflineSize] = useState<number | null>(null);
  const [fontBytes, setFontBytes] = useState<number | null>(null);
  const fontCount = offlineFontFamilies(draft).length;
  useEffect(() => { let live = true; setFontBytes(null); void offlineFontBytes(draft).then((b) => { if (live) setFontBytes(b); }); return () => { live = false; }; }, [draft]);
  const notes = audioCount(draft);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const samples = countSamples(draft.pages);
  const empties = countEmptyPhotos(draft.pages);
  const to = draft.to.trim() || "them";

  useEffect(() => {
    close.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [busy, onClose]);

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); setNote(what + " copied."); return true; } catch { setNote("Your browser would not copy. Select the " + what.toLowerCase() + " and copy it by hand."); return false; }
  };

  const saveOffline = async () => {
    setOffline("busy"); setOfflineError(null);
    try { setOfflineSize(await downloadOffline(draft)); setOffline("done"); }
    catch (e) { setOffline("idle"); setOfflineError(e instanceof OfflineError ? e.message : "We could not make the offline file. Please try again."); }
  };
  const offlineBlock = (
    <div>
      <button type="button" onClick={saveOffline} disabled={offline === "busy" || busy} className={btn + " border border-stone-300 text-stone-800 hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-50"}>{offline === "busy" ? "Preparing the file…" : "Download offline"}</button>
      <p className="mt-1 text-sm text-stone-500" role="status">{offline === "done" ? `The file was made${offlineSize ? ` (${(offlineSize / 1e6).toFixed(1)} MB)` : ""}. Open it from your downloads: it works without internet.` : "One file that opens without internet, for a phone or a laptop."}</p>
      {notes > 0 && offline !== "done" && <p className="mt-1 text-sm text-stone-500">Your {notes === 1 ? "voice note is" : `${notes} voice notes are`} saved inside, so the file will be bigger (up to about 7 MB more for each).</p>}
      {offline !== "done" && fontBytes !== null && <p className="mt-1 text-sm text-stone-500">The {fontCount === 1 ? "font is" : `${fontCount} fonts are`} saved inside too: about {fontBytes >= 1e6 ? (fontBytes / 1e6).toFixed(1) + " MB" : Math.max(1, Math.round(fontBytes / 1e3)) + " KB"}.</p>}
      {offlineError && <p role="alert" className="mt-1 rounded-lg bg-red-50 p-3 text-sm text-red-800">{offlineError}</p>}
    </div>
  );

  const go = async () => {
    setBusy(true); setError(null);
    const r = await publish(draft);
    if (!r.ok) { setBusy(false); setError(r.message); return; }
    let copied = false, shared = false;
    try { await navigator.clipboard.writeText(r.giftUrl); copied = true; } catch { /* the link stays on screen */ }
    try { if (navigator.share) { await navigator.share({ title: "A gift for " + to, url: r.giftUrl }); shared = true; } } catch { /* cancelled or not allowed: the Share button remains */ }
    setDone({ giftUrl: r.giftUrl, editUrl: r.editUrl, copied, shared }); setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-4 sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="send-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="send-title" className="font-display text-2xl font-bold">{done ? "Your gift is ready" : "Send to " + to}</h2>

        {!done && (
          <div className="mt-4 space-y-4 text-stone-700">
            <p>Publishing makes a private link. Only people you send it to can open the gift.</p>
            {empties > 0 && <p role="note" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{empties === 1 ? "One added photo has" : empties + " added photos have"} no picture yet, so {empties === 1 ? "it shows" : "they show"} an empty frame. You can send anyway, or close this and add {empties === 1 ? "a picture" : "pictures"} or delete {empties === 1 ? "it" : "them"} first.</p>}
            {samples > 0 && <p role="note" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{samples === 1 ? "One photo is" : samples + " photos are"} still a sample picture. You can send it anyway, or close this and replace {samples === 1 ? "it" : "them"} first.</p>}
            {!enabled && <p role="status" className="rounded-lg bg-stone-100 p-3 text-sm">Publishing is not available yet, so nothing can be sent from here. Your draft is saved on this device.</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {offlineBlock}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={go} disabled={!enabled || busy} className={btn + " bg-rose-700 text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"}>{busy ? "Publishing…" : "Publish and copy link"}</button>
              <button ref={close} type="button" onClick={onClose} disabled={busy} className={btn + " border border-stone-300 text-stone-700 hover:border-stone-500 disabled:opacity-50"}>Close</button>
            </div>
          </div>
        )}

        {done && (
          <div className="mt-4 space-y-5 text-stone-700">
            <div>
              <label htmlFor="gift-link" className="block text-sm font-bold text-stone-800">Link for {to}</label>
              <input id="gift-link" readOnly value={done.giftUrl} onFocus={(e) => e.currentTarget.select()} className="mt-1 block w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm" />
              <p className="mt-1 text-sm" role="status">{done.copied ? "Link copied." : "Copy the link above to send it."}{done.shared ? " Shared." : ""}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => copy(done.giftUrl, "Link")} className={btn + " border border-stone-300 hover:border-stone-500"}>Copy link</button>
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && <button type="button" onClick={() => navigator.share({ title: "A gift for " + to, url: done.giftUrl }).catch(() => undefined)} className={btn + " border border-stone-300 hover:border-stone-500"}>Share…</button>}
              </div>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <label htmlFor="edit-link" className="block text-sm font-bold text-amber-950">Your edit link. Save it now.</label>
              <p className="mt-1 text-sm text-amber-900">This is the only way to change the gift later. We show it once and cannot recover it.</p>
              <input id="edit-link" readOnly value={done.editUrl} onFocus={(e) => e.currentTarget.select()} className="mt-2 block w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm" />
              <button type="button" onClick={() => copy(done.editUrl, "Edit link")} className={btn + " mt-2 border border-amber-400 text-amber-950 hover:bg-amber-100"}>Copy edit link</button>
            </div>
            <p className="text-sm" role="status">{note}</p>
            {offlineBlock}
            <button ref={close} type="button" onClick={onClose} className={btn + " bg-stone-900 text-white hover:bg-stone-700"}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
