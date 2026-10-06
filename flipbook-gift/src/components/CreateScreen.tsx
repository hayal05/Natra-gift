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
      <Shell wide>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-rose-700">{t.name}</p>
            <h1 className="mt-1 font-display text-2xl font-bold">Your pages</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setStep("names")} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 hover:border-stone-500">← Names</button>
            <button type="button" onClick={() => setSending(true)} className="rounded-full bg-rose-700 px-5 py-2 text-sm font-bold text-white hover:bg-rose-800">Send</button>
          </div>
        </div>
        <div role="group" aria-label="Edit or preview" className="mt-5 inline-flex rounded-full border border-stone-300 bg-white p-1">
          {(["edit", "preview"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
              className={"rounded-full px-5 py-1.5 text-sm font-bold " + (view === v ? "bg-stone-900 text-white" : "text-stone-700 hover:text-stone-900")}>{v === "edit" ? "Edit" : "Preview"}</button>
          ))}
        </div>
        <div className="mt-6" hidden={view !== "edit"}>
          <PageEditor template={t} pages={draft.pages} to={draft.to} from={draft.from} fontPair={draft.fontPair} palette={draftPalette(draft)} paletteId={draft.paletteId ?? draft.templateId} onStyle={(patch) => set({ fontPair: patch.fontPair ?? draft.fontPair, paletteId: patch.paletteId === undefined ? draft.paletteId : patch.paletteId === draft.templateId ? undefined : patch.paletteId })} onChange={(pages) => set({ pages })} />
        </div>
        {view === "preview" && <div className="mt-6"><PreviewBook template={t} pages={draft.pages} to={draft.to} from={draft.from} fontPair={draft.fontPair} palette={draftPalette(draft)} /></div>}
        {sending && <PublishDialog draft={draft} publish={publishGift} onClose={() => setSending(false)} />}
        <p className="mt-6 text-center text-sm text-stone-500" role="status">
          {saveFailed ? "Your browser would not save this draft, so it will be lost if you close the page." : "Draft saved on this device."}
        </p>
      </Shell>
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
