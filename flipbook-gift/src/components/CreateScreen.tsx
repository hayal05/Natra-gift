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

type EditorTool = "Pages" | "Text" | "Media" | "Audio" | "Record" | "Style";

const input = "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900";

export default function CreateScreen() {
  const wanted = useSearchParams().get("t");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [step, setStep] = useState<"names" | "pages">("names");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [sending, setSending] = useState(false);
  const [activeTool, setActiveTool] = useState<EditorTool | null>(null);

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

  const activateEditorTool = (tool: EditorTool) => setActiveTool((current) => current === tool ? null : tool);

  const runEditorAction = (action: string) => {
    const root = document.querySelector("[data-natragift-editor]") as HTMLElement | null;
    if (!root) return;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
    const click = (matcher: string | RegExp) => buttons.find((b) => typeof matcher === "string" ? (b.textContent || "").trim() === matcher : matcher.test((b.textContent || "").trim()))?.click();
    if (action === "text") { root.querySelectorAll<HTMLButtonElement>('[aria-label="Parts of this page"] button')[0]?.click(); return; }
    if (action === "media") { Array.from(root.querySelectorAll<HTMLButtonElement>('[aria-label="Parts of this page"] button')).find((b) => /photo|image|picture/i.test((b.textContent || "").trim()))?.click(); return; }
    if (action === "pages") { root.querySelector('[aria-label="Page actions"]')?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (action === "audio" || action === "record") {
      const audio = Array.from(root.querySelectorAll("p")).find((p) => p.textContent?.trim() === "Audio note");
      (audio?.parentElement || root.querySelector("audio"))?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (action === "record") setTimeout(() => click(/^Record$|^Record a new note$/i), 120);
      return;
    }
    if (action === "style") {
      const summary = Array.from(root.querySelectorAll("summary")).find((el) => /Book style/i.test(el.textContent || ""));
      if (summary instanceof HTMLElement) { const details = summary.parentElement; if (details instanceof HTMLDetailsElement) details.open = true; summary.scrollIntoView({ behavior: "smooth", block: "center" }); }
    }
  };

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
              <div data-natragift-editor className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
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
          <>
            {activeTool && <EditorToolSheet tool={activeTool} onClose={() => setActiveTool(null)} onAction={runEditorAction} />}
            <nav aria-label="Editing tools" className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-1 overflow-x-auto">
                {([["Pages","▦"],["Text","T"],["Media","▧"],["Audio","♫"],["Record","●"],["Style","✦"]] as [EditorTool,string][]).map(([label,icon]) => (
                  <button key={label} type="button" aria-label={label} aria-pressed={activeTool === label} onClick={() => activateEditorTool(label)} className={"flex min-w-[62px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition active:scale-95 " + (activeTool === label ? "bg-stone-100 text-stone-900" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900")}>
                    <span className={"grid h-7 w-7 place-items-center rounded-lg text-xs font-black " + (activeTool === label ? "bg-rose-700 text-white" : "bg-stone-100")}>{icon}</span><span className="text-[10px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </>
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

function EditorToolSheet({ tool, onClose, onAction }: { tool: EditorTool; onClose: () => void; onAction: (action: string) => void }) {
  const config: Record<EditorTool, { title: string; icon: string; description: string; actions: { label: string; action: string; primary?: boolean }[] }> = {
    Pages: { title: "Pages", icon: "▦", description: "Manage the pages of your gift.", actions: [{ label: "＋ Add page", action: "pages", primary: true }, { label: "Duplicate", action: "pages" }, { label: "Reorder", action: "pages" }, { label: "Layouts", action: "pages" }] },
    Text: { title: "Text", icon: "T", description: "Select text, then use the editor controls for font, size, color and alignment.", actions: [{ label: "Select text", action: "text", primary: true }, { label: "Font", action: "text" }, { label: "Size", action: "text" }, { label: "Color", action: "text" }, { label: "Align", action: "text" }] },
    Media: { title: "Media", icon: "▧", description: "Choose and edit photos on the current page.", actions: [{ label: "Select photo", action: "media", primary: true }, { label: "Choose photo", action: "media" }, { label: "Fit / Fill", action: "media" }, { label: "Filters", action: "media" }, { label: "Frames", action: "media" }] },
    Audio: { title: "Audio", icon: "♫", description: "Manage audio attached to this page.", actions: [{ label: "Audio controls", action: "audio", primary: true }, { label: "Add audio", action: "audio" }, { label: "Trim", action: "audio" }, { label: "Volume", action: "audio" }, { label: "Remove", action: "audio" }] },
    Record: { title: "Voice record", icon: "●", description: "Record a personal voice note for this page.", actions: [{ label: "● Record", action: "record", primary: true }, { label: "Stop", action: "record" }, { label: "Record again", action: "record" }, { label: "Use recording", action: "record" }] },
    Style: { title: "Book style", icon: "✦", description: "Change the overall look of your gift.", actions: [{ label: "Open style", action: "style", primary: true }, { label: "Colours", action: "style" }, { label: "Fonts", action: "style" }, { label: "Page style", action: "style" }] }
  };
  const current = config[tool];
  return (
    <section className="fixed inset-x-0 bottom-[76px] z-20 mx-auto w-full max-w-2xl px-3" aria-label={current.title + " tools"}>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-sm font-black text-rose-700">{current.icon}</span><div><p className="text-sm font-bold text-stone-900">{current.title}</p><p className="text-[11px] text-stone-400">Tool workspace</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close tool" className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-600">×</button>
        </div>
        <div className="max-h-[34vh] overflow-y-auto px-4 py-3"><p className="text-xs leading-5 text-stone-500">{current.description}</p><div className="mt-3 flex flex-wrap gap-2">{current.actions.map((item) => <button key={item.label} type="button" onClick={() => onAction(item.action)} className={"rounded-xl border px-3 py-2.5 text-xs font-bold transition active:scale-[.98] " + (item.primary ? "border-rose-700 bg-rose-700 text-white" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50")}>{item.label}</button>)}</div></div>
      </div>
    </section>
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
