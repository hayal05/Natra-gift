"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LIMITS, draftPalette, loadDraft, newDraft, saveDraft, type Draft } from "../lib/draft";
import { TEMPLATES, fill } from "../templates";
import CoverPreview from "./CoverPreview";
import { publishGift } from "../lib/publish";
import PageEditor from "./PageEditor";
import PreviewBook from "./PreviewBook";
import PublishDialog from "./PublishDialog";

const input = "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900";

export default function CreateScreen() {
  const wanted = useSearchParams().get("t");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [step, setStep] = useState<"names" | "pages">("names");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [sending, setSending] = useState(false);

  // Decide which draft to show: ?t=<id> that differs from the saved draft starts a fresh one (names carry over); otherwise resume.
  useEffect(() => {
    const saved = loadDraft();
    if (wanted && TEMPLATES[wanted]) setDraft(saved?.templateId === wanted ? saved : newDraft(wanted, saved ?? undefined));
    else if (wanted) setUnknown(true);
    else if (saved) setDraft(saved);
    else setUnknown(true);
  }, [wanted]);

  useEffect(() => { if (draft) setSaveFailed(!saveDraft(draft)); }, [draft]);

  if (unknown) {
    return (
      <Shell>
        <p className="text-lg text-stone-700">{wanted ? "We could not find that template." : "You have not started a gift yet."}</p>
        <Link href="/#templates" className="mt-5 inline-block rounded-full bg-rose-700 px-6 py-3 font-bold text-white hover:bg-rose-800">Choose a template</Link>
      </Shell>
    );
  }
  if (!draft) return <Shell><p className="text-stone-500" role="status">Loading your draft…</p></Shell>;

  const t = TEMPLATES[draft.templateId];
  const names = { to: draft.to.trim() || "them", from: draft.from.trim() || "me" };
  const suggested = fill(t.invitation, names);
  const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p });

  if (step === "pages") {
    return (
      <main className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#f7f5f2] text-stone-900">
        <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white/95 px-3 backdrop-blur">
          <button type="button" onClick={() => setStep("names")} aria-label="Back" className="grid h-10 w-10 place-items-center rounded-full text-xl text-stone-700 hover:bg-stone-100">←</button>
          <div className="min-w-0 text-center"><p className="truncate text-sm font-bold">{t.name}</p><p className="text-[11px] text-stone-400">Auto-saved</p></div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setView(view === "edit" ? "preview" : "edit")} className="rounded-full px-3 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100">{view === "edit" ? "Preview" : "Edit"}</button>
            <button type="button" onClick={() => setSending(true)} className="rounded-full bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-800">Send</button>
          </div>
        </header>
        <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {view === "edit" ? (
            <div className="mx-auto w-full max-w-2xl px-3 pb-28 pt-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">Editing</p><p className="text-sm font-semibold text-stone-700">{names.to} · {draft.pages.length} pages</p></div>
                <button type="button" onClick={() => setStep("names")} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-600">Gift details</button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <PageEditor active template={t} pages={draft.pages} to={draft.to} from={draft.from} fontPair={draft.fontPair} palette={draftPalette(draft)} paletteId={draft.paletteId ?? draft.templateId}
                  onStyle={(patch) => set({ fontPair: patch.fontPair ?? draft.fontPair, paletteId: patch.paletteId === undefined ? draft.paletteId : patch.paletteId === draft.templateId ? undefined : patch.paletteId })}
                  onChange={(pages) => set({ pages })} />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl px-3 py-5"><PreviewBook template={t} pages={draft.pages} to={draft.to} from={draft.from} fontPair={draft.fontPair} palette={draftPalette(draft)} /></div>
          )}
        </section>
        {view === "edit" && (
          <nav aria-label="Editing tools" className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
            <div className="mx-auto flex max-w-2xl items-center justify-between gap-1 overflow-x-auto">
              {[["Pages","▦","Manage pages, duplicate, reorder and change layouts."],["Text","T","Tap text on the page to edit it."],["Media","▧","Tap a photo on the page to replace, crop, zoom or filter it."],["Audio","♫","Add an audio note to the current page."],["Record","●","Record a voice note for the current page."],["Style","✦","Change colours and fonts for the whole book."]].map(([label,icon,hint]) => (
                <button key={label} type="button" title={hint} onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })} className="flex min-w-[62px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-stone-100 text-xs font-black">{icon}</span><span className="text-[10px] font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}
        {sending && <PublishDialog draft={draft} publish={publishGift} onClose={() => setSending(false)} />}
        <p className="sr-only" role="status">{saveFailed ? "Your browser would not save this draft." : "Draft saved on this device."}</p>
      </main>
    );
  }

  return (
    <Shell wide>
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-rose-700">{t.name}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Who is this gift for?</h1>
          <p className="mt-2 text-stone-600">Two names are all you need. Everything else is already written, and you can change it later.</p>

          <div className="mt-8 space-y-6">
            <label className="block text-sm font-bold text-stone-800">Their name
              <input className={input} value={draft.to} maxLength={LIMITS.name} autoComplete="off" placeholder="Maya"
                onChange={(e) => set({ to: e.target.value })} />
            </label>
            <label className="block text-sm font-bold text-stone-800">Your name
              <input className={input} value={draft.from} maxLength={LIMITS.name} autoComplete="name" placeholder="Daniel"
                onChange={(e) => set({ from: e.target.value })} />
            </label>
            <div>
              <label htmlFor="inv" className="block text-sm font-bold text-stone-800">Message on the envelope</label>
              <textarea id="inv" rows={3} className={input} maxLength={LIMITS.invitation} value={draft.invitation ?? suggested}
                onChange={(e) => set({ invitation: e.target.value })} />
              <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
                <span>{(draft.invitation ?? suggested).length} / {LIMITS.invitation}</span>
                {draft.invitation !== null && (
                  <button type="button" className="font-bold text-rose-700 hover:underline" onClick={() => set({ invitation: null })}>Use the suggested message</button>
                )}
              </div>
            </div>
          </div>

          <button type="button" onClick={() => setStep("pages")} className="mt-8 rounded-full bg-rose-700 px-6 py-3 font-bold text-white hover:bg-rose-800">Continue to the pages →</button>

          <p className="mt-6 text-sm text-stone-500" role="status">
            {saveFailed ? "Your browser would not save this draft, so it will be lost if you close the page." : "Draft saved on this device."}
          </p>
          <p className="mt-4 text-sm"><Link href="/#templates" className="font-bold text-stone-700 underline">Choose a different template</Link></p>
        </div>

        <div className="mx-auto w-full max-w-[300px]">
          <CoverPreview template={t} to={draft.to} from={draft.from} fontPair={draft.fontPair} palette={draftPalette(draft)} />
          <p className="mt-3 text-center text-sm text-stone-500">Your cover</p>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={"mx-auto px-5 py-10 md:py-14 " + (wide ? "max-w-4xl" : "max-w-xl text-center")}>
      <Link href="/" className="mb-8 inline-block text-sm font-bold text-stone-600 hover:underline">← Digital Gift Flipbook</Link>
      {children}
    </main>
  );
}
