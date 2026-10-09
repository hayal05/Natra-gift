"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { draftPalette, loadDraft, newDraft, saveDraft, type Draft } from "../lib/draft";
import { TEMPLATES, fill } from "../templates";
import { publishGift } from "../lib/publish";
import NamesStep, { Shell } from "./NamesStep";
import PageEditor from "./PageEditor";
import PreviewBook from "./PreviewBook";
import PublishDialog from "./PublishDialog";
import { Icon, type IconName } from "./icons";

type EditorTool = "Pages" | "Edit" | "Audio" | "Style";
const TOOLS: [EditorTool, IconName][] = [["Pages", "pages"], ["Edit", "text"], ["Audio", "audio"], ["Style", "style"]];

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
        <p className="text-lg text-[#4a525b]">{wanted ? "We could not find that template." : "You have not started a gift yet."}</p>
        <Link href="/#templates" className="mt-5 inline-block rounded-full bg-[#ff6900] px-6 py-3 font-semibold text-white hover:bg-[#f25e00]">Choose a template</Link>
      </Shell>
    );
  }
  if (!draft) return <Shell><p className="text-[#8b8279]" role="status">Loading your draft…</p></Shell>;

  const t = TEMPLATES[draft.templateId];
  const names = { to: draft.to.trim() || "them", from: draft.from.trim() || "me" };
  const suggested = fill(t.invitation, names);
  const set = (p: Partial<Draft>) => setDraft({ ...draft, ...p });

  const activateEditorTool = (tool: EditorTool) => setActiveTool((current) => current === tool ? null : tool);

  if (step === "pages") {
    return (
      <main className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#f7f5f2] text-stone-900"
        style={{ ["--hdr-h" as string]: "56px", ["--nav-h" as string]: "calc(76px + env(safe-area-inset-bottom, 0px))", ["--tool-panel-h" as string]: "clamp(176px, 30dvh, 236px)" }}>
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
            <div className="mx-auto w-full max-w-2xl px-3 pt-1" style={{ paddingBottom: activeTool ? "calc(var(--nav-h) + var(--tool-panel-h) + 16px)" : "calc(var(--nav-h) + 16px)" }}>
              <div data-natragift-editor>
                <PageEditor active template={t} pages={draft.pages} to={draft.to} from={draft.from} fontPair={draft.fontPair} palette={draftPalette(draft)} paletteId={draft.paletteId ?? draft.templateId} activeTool={activeTool} onClose={() => setActiveTool(null)}
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
            
            <nav aria-label="Editing tools" className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="mx-auto flex max-w-2xl items-stretch justify-between gap-1">
                {TOOLS.map(([label, icon]) => (
                  <button key={label} type="button" aria-label={label} aria-pressed={activeTool === label} onClick={() => activateEditorTool(label)} className={"flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition active:scale-95 " + (activeTool === label ? "bg-stone-100 text-stone-900" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900")}>
                    <span className={"grid h-7 w-7 place-items-center rounded-lg " + (activeTool === label ? "bg-rose-700 text-white" : "bg-stone-100")}><Icon name={icon} size={18} /></span><span className="text-[11px] font-semibold">{label}</span>
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

  return <NamesStep template={t} draft={draft} suggested={suggested} saveFailed={saveFailed} set={set} onContinue={() => setStep("pages")} />;
}
