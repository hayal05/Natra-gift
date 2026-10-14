"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { draftPalette, loadDraft, newDraft, saveDraft, type Draft } from "../lib/draft";
import { TEMPLATES, fill } from "../templates";
import { publishGift } from "../lib/publish";
import NamesStep, { Shell } from "./NamesStep";
import PageEditor from "./PageEditor";
import PreviewBook from "./PreviewBook";
import PublishDialog from "./PublishDialog";
import { Icon, type IconName } from "./icons";

type EditorTool = "Pages" | "Edit" | "Audio" | "Style";
type EditorAction = "add-text" | "add-photo" | "duplicate" | "delete" | "clear" | "bold" | "italic" | "add-page" | "duplicate-page";
const MAIN_TOOLS: { label: string; icon: IconName; tool?: EditorTool; action?: EditorAction }[] = [
  { label: "Pages", icon: "pages", tool: "Pages" },
  { label: "Text", icon: "text", action: "add-text" },
  { label: "Photo", icon: "photo", action: "add-photo" },
  { label: "Audio", icon: "audio", tool: "Audio" },
  { label: "Design", icon: "style", tool: "Style" },
];

export default function CreateScreen() {
  const wanted = useSearchParams().get("t");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [step, setStep] = useState<"names" | "pages">("names");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [sending, setSending] = useState(false);
  const [activeTool, setActiveTool] = useState<EditorTool | null>(null);
  const [selectedKind, setSelectedKind] = useState<"text" | "photo" | null>(null);
  const [pagesMenu, setPagesMenu] = useState(false);
  const [pageControl, setPageControl] = useState<"navigate" | "layout" | null>(null);
  const [textMenu, setTextMenu] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [designMenu, setDesignMenu] = useState(false);
  const [audioMenu, setAudioMenu] = useState(false);
  const [audioControl, setAudioControl] = useState<"upload" | "record" | "manage" | null>(null);
  const [designControl, setDesignControl] = useState<"colors" | "fonts" | "background" | null>(null);
  const [photoControl, setPhotoControl] = useState<"replace" | "fit" | "frame" | "filter" | "zoom" | null>(null);
  const [textControl, setTextControl] = useState<"font" | "size" | "align" | "color" | "style" | null>(null);
  const [editorCommand, setEditorCommand] = useState<{ id: number; action: EditorAction } | null>(null);
  const commandId = useRef(0);

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
  const runEditorAction = (action: EditorAction) => {
    setEditorCommand({ id: ++commandId.current, action });
    if (action === "delete") setActiveTool("Edit");
    else if (action === "clear") setActiveTool(null);
  };
  const toolbar = MAIN_TOOLS;
  const PAGE_TOOLS = ["Navigate", "Layout"] as const;
  const choosePageTool = (label: typeof PAGE_TOOLS[number]) => {
    setPageControl(label.toLowerCase() as "navigate" | "layout");
    setActiveTool("Pages");
  };
  const TEXT_TOOLS = ["Add text", "Font", "Size", "Align", "Color", "Style"] as const;
  const PHOTO_TOOLS = ["Add photo", "Replace", "Fit", "Frame", "Filter", "Zoom"] as const;
  const DESIGN_TOOLS = ["Colors", "Fonts", "Background"] as const;
  const AUDIO_TOOLS = ["Upload", "Record", "Manage"] as const;
  const chooseAudioTool = (tool: typeof AUDIO_TOOLS[number]) => {
    setAudioControl(tool.toLowerCase() as "upload" | "record" | "manage");
    setActiveTool("Audio");
  };
  const chooseDesignTool = (tool: typeof DESIGN_TOOLS[number]) => {
    setDesignControl(tool.toLowerCase() as "colors" | "fonts" | "background");
    setActiveTool("Style");
  };
  const choosePhotoTool = (tool: typeof PHOTO_TOOLS[number]) => {
    if (tool === "Add photo") { runEditorAction("add-photo"); setPhotoControl(null); setActiveTool(null); return; }
    setPhotoControl(tool.toLowerCase() as "replace" | "fit" | "frame" | "filter" | "zoom");
    setActiveTool("Edit");
  };
  const chooseTextTool = (tool: typeof TEXT_TOOLS[number]) => {
    if (tool === "Add text") { runEditorAction("add-text"); setTextControl(null); setActiveTool(null); return; }
    setTextControl(tool.toLowerCase() as "font" | "size" | "align" | "color" | "style");
    setActiveTool("Edit");
  };
  const openMainTool = (label: string, tool?: EditorTool, action?: EditorAction) => {
    if (label === "Pages") {
      setPagesMenu(current => !current); setPageControl(null);
      setTextMenu(false); setTextControl(null); setPhotoMenu(false); setPhotoControl(null); setDesignMenu(false); setDesignControl(null); setAudioMenu(false); setAudioControl(null); setActiveTool(null);
    } else if (label === "Text") {
      setTextMenu(current => !current);
      setPhotoMenu(false); setPhotoControl(null); setPagesMenu(false); setPageControl(null); setDesignMenu(false); setDesignControl(null);
      setTextControl(null);
      setActiveTool(null);
    } else if (label === "Photo") {
      setPhotoMenu(current => !current);
      setTextMenu(false); setTextControl(null); setPagesMenu(false); setPageControl(null); setDesignMenu(false); setDesignControl(null);
      setPhotoControl(null); setActiveTool(null);
    } else if (label === "Audio") {
      setAudioMenu(current => !current); setAudioControl(null);
      setTextMenu(false); setTextControl(null); setPhotoMenu(false); setPhotoControl(null); setPagesMenu(false); setPageControl(null); setDesignMenu(false); setDesignControl(null); setActiveTool(null);
    } else if (label === "Design") {
      setDesignMenu(current => !current); setDesignControl(null);
      setTextMenu(false); setTextControl(null); setPhotoMenu(false); setPhotoControl(null); setPagesMenu(false); setPageControl(null); setAudioMenu(false); setAudioControl(null); setActiveTool(null);
    } else {
      setTextMenu(false); setTextControl(null); setPhotoMenu(false); setPhotoControl(null); setPagesMenu(false); setPageControl(null); setDesignMenu(false); setDesignControl(null); setAudioMenu(false); setAudioControl(null);
      if (tool) activateEditorTool(tool);
      else if (action) runEditorAction(action);
    }
  };

  if (step === "pages") {
    return (
      <main className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-[#f7f5f2] text-stone-900"
        style={{ ["--hdr-h" as string]: "56px", ["--nav-h" as string]: "calc(76px + env(safe-area-inset-bottom, 0px))", ["--tool-panel-h" as string]: "clamp(228px, 38dvh, 340px)" }}>
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
            <div className="mx-auto w-full max-w-2xl px-3 pt-1" style={{ paddingBottom: activeTool ? (textControl || photoControl || pageControl || designControl || audioControl ? "calc(var(--nav-h) + 162px)" : "calc(var(--nav-h) + 280px)") : textMenu || photoMenu || pagesMenu || designMenu || audioMenu ? "calc(var(--nav-h) + 48px)" : "calc(var(--nav-h) + 16px)" }}>
              <div data-natragift-editor>
                <PageEditor active template={t} pages={draft.pages} to={draft.to} from={draft.from} fontPair={draft.fontPair} palette={draftPalette(draft)} paletteId={draft.paletteId ?? draft.templateId} activeTool={activeTool} pageControl={pagesMenu ? pageControl : null} textControl={textMenu ? textControl : null} photoControl={photoMenu ? photoControl : null} designControl={designMenu ? designControl : null} audioControl={audioMenu ? audioControl : null} onClose={() => { setActiveTool(null); setTextControl(null); setPhotoControl(null); setPageControl(null); setDesignControl(null); setAudioControl(null); }} editorCommand={editorCommand} onSelectionChange={(kind) => { setSelectedKind(kind); }}
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
            
            {pagesMenu && <div className="fixed inset-x-0 z-30 border-t border-stone-700 bg-black px-2 py-1 text-white shadow-lg" style={{ bottom: "var(--nav-h)" }}>
              <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto" role="toolbar" aria-label="Page tools">
                {PAGE_TOOLS.map(label => <button key={label} type="button" onClick={() => choosePageTool(label)} aria-pressed={pageControl === label.toLowerCase()} className={"h-8 shrink-0 rounded-md border px-2.5 text-[11px] font-semibold " + (pageControl === label.toLowerCase() ? "border-rose-500 bg-rose-700" : "border-stone-700 bg-stone-900")}>{label}</button>)}
              </div>
            </div>}
            {textMenu && <div className="fixed inset-x-0 z-30 border-t border-stone-700 bg-black px-2 py-1 text-white shadow-lg" style={{ bottom: "var(--nav-h)" }}>
              <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto overscroll-x-contain" role="toolbar" aria-label="Text tools">
                {TEXT_TOOLS.map(label => <button key={label} type="button" onClick={() => chooseTextTool(label)} aria-pressed={textControl === label.toLowerCase()} className={"h-8 shrink-0 rounded-md border px-2.5 text-[11px] font-semibold " + (textControl === label.toLowerCase() ? "border-rose-500 bg-rose-700 text-white" : "border-stone-700 bg-stone-900 text-white")}>{label}</button>)}
              </div>
            </div>}
            {photoMenu && <div className="fixed inset-x-0 z-30 border-t border-stone-700 bg-black px-2 py-1 text-white shadow-lg" style={{ bottom: "var(--nav-h)" }}>
              <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto overscroll-x-contain" role="toolbar" aria-label="Photo tools">
                {PHOTO_TOOLS.map(label => <button key={label} type="button" onClick={() => choosePhotoTool(label)} aria-pressed={photoControl === label.toLowerCase()} className={"h-8 shrink-0 rounded-md border px-2.5 text-[11px] font-semibold " + (photoControl === label.toLowerCase() ? "border-rose-500 bg-rose-700 text-white" : "border-stone-700 bg-stone-900 text-white")}>{label}</button>)}
              </div>
            </div>}
            {designMenu && <div className="fixed inset-x-0 z-30 border-t border-stone-700 bg-black px-2 py-1 text-white shadow-lg" style={{ bottom: "var(--nav-h)" }}>
              <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto overscroll-x-contain" role="toolbar" aria-label="Design tools">
                {DESIGN_TOOLS.map(label => <button key={label} type="button" onClick={() => chooseDesignTool(label)} aria-pressed={designControl === label.toLowerCase()} className={"h-8 shrink-0 rounded-md border px-2.5 text-[11px] font-semibold " + (designControl === label.toLowerCase() ? "border-rose-500 bg-rose-700 text-white" : "border-stone-700 bg-stone-900 text-white")}>{label}</button>)}
              </div>
            </div>}
            {audioMenu && <div className="fixed inset-x-0 z-30 border-t border-stone-700 bg-black px-2 py-1 text-white shadow-lg" style={{ bottom: "var(--nav-h)" }}>
              <div className="mx-auto flex max-w-2xl gap-1.5 overflow-x-auto overscroll-x-contain" role="toolbar" aria-label="Audio tools">
                {AUDIO_TOOLS.map(label => <button key={label} type="button" onClick={() => chooseAudioTool(label)} aria-pressed={audioControl === label.toLowerCase()} className={"h-8 shrink-0 rounded-md border px-2.5 text-[11px] font-semibold " + (audioControl === label.toLowerCase() ? "border-rose-500 bg-rose-700 text-white" : "border-stone-700 bg-stone-900 text-white")}>{label}</button>)}
              </div>
            </div>}
            <nav aria-label="Editing tools" className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
              <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1">
                {toolbar.map(({ label, icon, tool, action }) => (
                  <button key={label} type="button" aria-label={label} aria-pressed={label === "Pages" ? pagesMenu : label === "Text" ? textMenu : label === "Photo" ? photoMenu : label === "Design" ? designMenu : label === "Audio" ? audioMenu : !!tool && activeTool === tool}
                    onClick={() => openMainTool(label, tool, action)}
                    className={"relative flex min-h-[56px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-700 " + ((label === "Pages" && pagesMenu) || (label === "Text" && textMenu) || (label === "Photo" && photoMenu) || (label === "Design" && designMenu) || (label === "Audio" && audioMenu) || (tool && activeTool === tool) ? "bg-rose-50 text-rose-800" : "text-stone-600 hover:bg-stone-100")}>
                    {((label === "Text" && textMenu) || (label === "Design" && designMenu) || (label === "Audio" && audioMenu) || (tool && activeTool === tool)) && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-rose-700" />}
                    <Icon name={icon} size={21} />
                    <span className="text-[11px] font-semibold">{label}</span>
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
