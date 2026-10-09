"use client";
// Flat page editor (task 3.2): one page shown large, tap a slot to select it, thumbnail strip to move between pages.
// Task 3.3 adds the layout picker and 3.4 the text controls (text box in the selection card, style controls in the collapsed Customize panel).
// Task 3.5 adds photo controls (3.5b: fill/fit and frame chips, 3.5c: filter chips, 3.5d: zoom slider, 3.5f: drag the photo on the page to pan, 3.5g: choose a new photo and reset, in a "Photo" section of the Customize panel); page controls arrive in 3.6 (3.6b: Add page and Duplicate above the thumbnail strip, 3.6c: Delete with a confirm step, 3.6d: Move earlier and Move later; 3.6e: page colour in a \"Page\" section of the Customize panel); 3.7 adds the \"Book style\" panel (colours from the ten templates, two font pairs).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GROUP_NAMES, actionBarSpot, otherBoxes, bgHidden, bgProblem, pageBgOptions, setPageBg, MAX_PAGES, MIN_PAGES, TEXT_COLORS, addPage, addSlot, deleteSlot, duplicateSlot, canAddPage, canDeletePage, canMovePage, deletePage, duplicatePage, editableAt, isAdjusted, pageEditable, movePage, resetTextBox, photoFileProblem, photoOverflow, replacePhoto, resetPhoto, setPhoto, setSlotText, setTextPosition, setTextStyle, slotName, slotSummary, swapLayout, textLimit } from "../lib/editor";
import { isSample, loadFonts, usedFontIds, loadImages, renderPage, photoSlotRect, textFitRect, textEditBox, slotRect, textSlotRect, sizeFactor, TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_WIDTH_MIN, type Align, type ColorRef, type ImageMap, type PageData, type Palette, type PhotoContent, type PhotoFilter, type PhotoFit, type PhotoFrame, type SizeStep, type TextSlotDef, type TextStyle } from "../lib/pages";
import { PALETTE_PRESETS } from "../lib/draft";
import { UPLOADS_ENABLED, blobToDataUri, resizePhoto, uploadPhoto } from "../lib/photo";
import { AUDIO_ENABLED, AUDIO_MAX_SECONDS, AUDIO_OFF_REASON, RECORD_MAX_SECONDS, audioFileProblem, readAudioDuration, recordingSupported, uploadAudio } from "../lib/audio";
import { createRecorder, type Recorder } from "../audio/recorder";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import VoiceNotePill, { type PillPos } from "./VoiceNotePill";
import FontPicker from "./FontPicker";
import { LAYOUTS, LAYOUT_LIST, bookStyle, fillPages, type Template } from "../templates";

// Panel layout helpers (10.5): a small heading over a block, and one row per control with its label on the left.
const Group = ({ title, children }: { title: string; children: ReactNode }) => <div role="group" aria-label={title}><h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">{title}</h3>{children}</div>;
const Row = ({ label, children }: { label: string; children: ReactNode }) => <div className="flex items-center gap-3 border-t border-stone-100 first:border-t-0"><span className="w-12 shrink-0 text-xs font-bold text-stone-500">{label}</span><div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">{children}</div></div>;
const fmtClock = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
const W = 360, H = 480, DPR = 2; // logical page size; the canvas is scaled by CSS
const TW = 60, TH = 80;
const LW = 90, LH = 120; // layout picker thumbnails (drawn at this size, 1x)

interface Props {
  template: Template;
  pages: PageData[];
  to: string;
  from: string;
  fontPair: 0 | 1;
  /** Book style presets (3.7): colours from another template, and which of the two font pairs. */
  palette?: Palette;
  paletteId: string;
  onStyle: (patch: { fontPair?: 0 | 1; paletteId?: string }) => void;
  /** Called with the full, updated list of draft pages (tokens such as {to} intact). */
  onChange: (pages: PageData[]) => void;
  /** False while the editor is hidden (Preview open); a recording in progress is then cancelled. Default true. */
  active?: boolean;
  /** Bottom tool workspace selected by the creator. */
  activeTool?: "Pages" | "Edit" | "Audio" | "Style" | null;
  /** Closes the tool panel (the X in its header). */
  onClose?: () => void;
}

export default function PageEditor({ template, pages, to, from, fontPair, palette, paletteId, onStyle, onChange, active = true, activeTool = null, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState(false);
  const [ready, setReady] = useState(false);
  const [fontTick, setFontTick] = useState(0); // bumps when a newly picked font has loaded, so the page and thumbnails redraw in it
  const [images, setImages] = useState<ImageMap>(() => new Map());
  const main = useRef<HTMLCanvasElement>(null);
  const textInput = useRef<HTMLTextAreaElement>(null);
  const thumbs = useRef<(HTMLCanvasElement | null)[]>([]);
  const strip = useRef<HTMLUListElement>(null);
  const picks = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState<{ label: string; pct: number | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSlotDelete, setConfirmSlotDelete] = useState(false);
  const [slotNote, setSlotNote] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState<{ label: string; pct: number | null } | null>(null);
  // Voice recording (9.4): "idle" -> "starting" (permission prompt) -> "recording" -> "review" (listen, use or record again).
  const [recPhase, setRecPhase] = useState<"idle" | "starting" | "recording" | "review">("idle");
  const [recSeconds, setRecSeconds] = useState(0);
  const [recTake, setRecTake] = useState<{ blob: Blob; seconds: number; url: string; autoStopped: boolean } | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [canRecord, setCanRecord] = useState(false); // decided in the browser, so server and first client render agree
  const recorder = useRef<Recorder | null>(null);
  const takeUrl = useRef<string | null>(null);

  const book = useMemo(() => bookStyle(template, fontPair, palette), [template, fontPair, palette]);
  const filled = useMemo(() => fillPages(pages, { to: to.trim() || "you", from: from.trim() || "me" }), [pages, to, from]);
  const at = Math.min(index, filled.length - 1);
  const page = filled[at];
  const layout = LAYOUTS[page.layout];
  const slots = pageEditable(layout, page);
  const slot = slots.find((s) => s.id === slotId) ?? null;

  const fontKey = usedFontIds(pages).join(",");
  useEffect(() => { let alive = true; loadFonts(book.fonts, pages).then(() => { if (alive) { setReady(true); setFontTick((t) => t + 1); } }); return () => { alive = false; }; }, [book, fontKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { let alive = true; loadImages(filled, new Map(images)).then((m) => alive && setImages(m)); return () => { alive = false; }; }, [filled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw the big page and every thumbnail whenever anything they show changes.
  useEffect(() => {
    if (!ready) return;
    const draw = (cv: HTMLCanvasElement | null, p: PageData, i: number, w: number, h: number) => {
      const c = cv?.getContext("2d"), l = LAYOUTS[p.layout];
      if (!cv || !c || !l) return;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      renderPage(c, w, h, p, l, book, images, i);
    };
    draw(main.current, page, at, W, H);
    filled.forEach((p, i) => draw(thumbs.current[i], p, i, W, H)); // thumbnails draw at full size and are scaled down by CSS
  }, [ready, fontTick, book, filled, images, page, at]);

  // Layout picker previews: every layout drawn with this page's content. Only while the Pages tab is open.
  const panelOpen = activeTool === "Pages";
  useEffect(() => {
    if (!ready || !panelOpen) return;
    for (const l of LAYOUT_LIST) {
      const cv = picks.current[l.id], c = cv?.getContext("2d");
      if (!cv || !c) continue;
      c.setTransform(1, 0, 0, 1, 0, 0);
      renderPage(c, LW, LH, swapLayout(page, l, at), l, book, images, at);
    }
  }, [ready, fontTick, panelOpen, book, page, at, images]);

  const chooseLayout = (id: string) => {
    const next = LAYOUTS[id];
    if (!next || next.id === page.layout) return;
    onChange(pages.map((p, i) => (i === at ? swapLayout(p, next, at) : p)));
    setSlotId(null);
  };

  const textSlot = slot && slot.kind === "text" ? slot : null;
  const style: TextStyle = (textSlot && pages[at]?.styles?.[textSlot.id]) || {};
  const typed = textSlot ? (typeof page.slots[textSlot.id] === "string" ? (page.slots[textSlot.id] as string) : "") : "";
  const textFit = textSlot ? textFitRect(textSlot, style, typed, book, W, H) : null;
  // On-page text editor: exact typography of the drawn text, scaled from page px to the canvas as shown on screen.
  const editBox = textSlot && editingText ? textEditBox(textSlot, style, typed, book, W, H) : null;
  const [shownScale, setShownScale] = useState(1);
  useEffect(() => {
    const cv = main.current;
    if (!cv) return;
    const measure = () => { if (cv.clientWidth > 0) setShownScale(cv.clientWidth / W); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cv);
    return () => ro.disconnect();
  }, []);
  const pageBox = useRef<HTMLDivElement>(null);
  /** What a tap on text hits: the slot plus the text as drawn (it may have grown or been scaled), padded for fingers. */
  const textArea = (s: TextSlotDef, st: TextStyle | undefined, raw: string) => {
    const slotR = textSlotRect(s, st, W, H);
    const t = raw.trim() ? textFitRect(s, st, raw, book, W, H) : slotR;
    const x1 = Math.min(slotR.x, t.x) - 6, y1 = Math.min(slotR.y, t.y) - 6;
    return { x: x1, y: y1, w: Math.max(slotR.x + slotR.w, t.x + t.w) + 6 - x1, h: Math.max(slotR.y + slotR.h, t.y + t.h) + 6 - y1 };
  };
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const photoSlot = slot && slot.kind === "photo" ? slot : null;
  const rawPhoto = photoSlot ? pages[at]?.slots[photoSlot.id] : undefined;
  const photo: PhotoContent = typeof rawPhoto === "object" && rawPhoto ? rawPhoto : { src: "" };
  const editPage = (next: PageData) => onChange(pages.map((p, i) => (i === at ? next : p)));
  // Component actions (10.6): add text or photo, copy and delete the selected one. Delete has an inline Yes / Keep step because there is no undo.
  useEffect(() => { setConfirmSlotDelete(false); setSlotNote(null); }, [slotId, at]);
  const addComp = (kind: "text" | "photo") => { const r = addSlot(pages[at], layout, kind); if (r.reason) { setSlotNote(r.reason); return; } editPage(r.page); setSlotId(r.id ?? null); setEditingText(false); setSlotNote(null); };
  const copyComp = () => { if (!slot) return; const r = duplicateSlot(pages[at], layout, slot.id); if (r.reason) { setSlotNote(r.reason); return; } editPage(r.page); setSlotId(r.id ?? null); setEditingText(false); setSlotNote(null); };
  const removeComp = () => { if (!slot) return; const r = deleteSlot(pages[at], layout, slot.id); setConfirmSlotDelete(false); if (r.reason) { setSlotNote(r.reason); return; } editPage(r.page); setSlotId(null); setEditingText(false); setSlotNote(null); };
  const addTextWhy = addSlot(pages[at], layout, "text").reason ?? null; // why adding is not possible right now (the limit), if so
  const copyWhy = slot ? duplicateSlot(pages[at], layout, slot.id).reason ?? null : null;
  const deleteWhy = slot ? deleteSlot(pages[at], layout, slot.id).reason ?? null : null;
  const setText = (v: string) => textSlot && editPage(setSlotText(pages[at], textSlot, v));
  const setPhotoProps = (patch: Partial<PhotoContent>) => photoSlot && editPage(setPhoto(pages[at], photoSlot.id, patch));
  const setStyle = (patch: Partial<TextStyle>) => textSlot && editPage(setTextStyle(pages[at], textSlot.id, patch));
  const setTextPositionFromStart = (start: TextStyle, dx: number, dy: number) =>
    textSlot && editPage(setTextPosition(pages[at], textSlot.id, (start.x ?? 0) + dx, (start.y ?? 0) + dy));
  // Picking the layout's own value clears the override, so "reset" is just choosing the default again.
  const cur = {
    font: style.font ?? textSlot?.font, size: style.size ?? "M", align: style.align ?? textSlot?.align ?? "left", color: style.color ?? textSlot?.color,
    bold: style.bold ?? (textSlot?.weight ?? 400) >= 600, italic: style.italic ?? !!textSlot?.italic,
  };
  // Bold / Italic toggle against what the layout already does; going back to the layout's own value clears the override.
  const toggleBold = () => textSlot && setStyle({ bold: !cur.bold === ((textSlot.weight ?? 400) >= 600) ? undefined : !cur.bold });
  const toggleItalic = () => textSlot && setStyle({ italic: !cur.italic === !!textSlot.italic ? undefined : !cur.italic });
  const chip = (on: boolean) => "min-h-[44px] rounded-md border px-3 py-1.5 text-xs font-bold transition " + (on ? "border-rose-700 bg-rose-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500");

  useEffect(() => { setPhotoError(null); }, [slotId, index]);
  useEffect(() => { if (!textSlot) setEditingText(false); }, [textSlot?.id]);
  // When editing starts (or moves to another text), focus synchronously, which keeps the mobile keyboard tied to the tap,
  // and put the caret at the end of the text. Later taps inside the box are left to the browser so the finger can place the caret.
  useLayoutEffect(() => {
    if (!editingText) return;
    const input = textInput.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const end = input.value.length;
    input.setSelectionRange(end, end);
    input.scrollTop = input.scrollHeight;
  }, [editingText, slotId]);
  useEffect(() => { setCanRecord(recordingSupported()); }, []);
  /** Throws away any recording (in progress or waiting for a decision) and releases the microphone. */
  const dropRecording = () => {
    recorder.current?.cancel();
    recorder.current = null;
    if (takeUrl.current) { URL.revokeObjectURL(takeUrl.current); takeUrl.current = null; }
    setRecTake(null);
    setRecSeconds(0);
    setRecPhase("idle");
  };
  const dropRef = useRef(dropRecording);
  dropRef.current = dropRecording;
  useEffect(() => { dropRef.current(); setRecError(null); }, [index]); // a recording belongs to the page it was made for
  useEffect(() => { if (!active) dropRef.current(); }, [active]);
  // 10.8a: the recording controls live only in the Audio tab, so leaving it (X, another tab) must not leave the microphone on.
  useEffect(() => { if (activeTool !== "Audio") { dropRef.current(); setRecError(null); } }, [activeTool]);
  useEffect(() => () => dropRef.current(), []); // unmount
  useEffect(() => { setConfirmDelete(false); }, [index, pages.length, activeTool]); // a pending question never follows the creator to another page

  // Choose a photo (3.5g, 3.8). The file is shrunk in the browser first (and uploaded when uploads are on), so a broken file
  // shows a message and the old photo stays. While it works the page can still be edited; the result goes to the page it was chosen for.
  const choosePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again still fires
    if (!file || !photoSlot || photoBusy) return;
    const problem = photoFileProblem(file);
    if (problem) { setPhotoError(problem); return; }
    const id = photoSlot.id, original = pagesRef.current[at], target = at;
    setPhotoError(null);
    setPhotoBusy({ label: "Preparing your photo…", pct: null });
    try {
      const { blob } = await resizePhoto(file);
      let src: string;
      if (UPLOADS_ENABLED) {
        setPhotoBusy({ label: "Uploading…", pct: 0 });
        src = await uploadPhoto(blob, (f) => setPhotoBusy({ label: "Uploading…", pct: Math.round(f * 100) }));
      } else src = await blobToDataUri(blob);
      const now = pagesRef.current;
      let i = now.indexOf(original); // the page may have moved while the photo was working
      if (i < 0 && now[target]?.layout === original.layout) i = target;
      if (i < 0) { setPhotoError("That page changed while the photo was loading, so it was not added. Please choose it again."); return; }
      onChange(now.map((p, k) => (k === i ? replacePhoto(p, id, src) : p)));
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setPhotoError(UPLOADS_ENABLED && ["sign", "network", "upload"].includes(m)
        ? "The photo could not be uploaded. Check your connection and try again."
        : "That file does not look like a photo this page can show. Please try another.");
    } finally { setPhotoBusy(null); }
  };

  useEffect(() => {
    const ul = strip.current, li = ul?.children[at] as HTMLElement | undefined;
    if (!ul || !li) return;
    if (li.offsetLeft < ul.scrollLeft) ul.scrollLeft = li.offsetLeft - 4;
    else if (li.offsetLeft + li.offsetWidth > ul.scrollLeft + ul.clientWidth) ul.scrollLeft = li.offsetLeft + li.offsetWidth - ul.clientWidth + 4;
  }, [at, pages.length]);

  const goto = (i: number) => { setIndex(i); setSlotId(null); setEditingText(false); };
  const selectedPhotoContent: PhotoContent | null = slot?.kind === "photo" && typeof pages[at]?.slots[slot.id] === "object" ? pages[at]?.slots[slot.id] as PhotoContent : null;
  const selectedPhotoRect = slot?.kind === "photo" ? photoSlotRect(slot, selectedPhotoContent ?? undefined, W, H) : null;

  // Page controls (3.6b). The new page is selected afterwards, so the creator can edit it straight away.
  const roomForPage = canAddPage(pages.length);
  const addNewPage = () => { if (!roomForPage) return; onChange(addPage(pages, at, LAYOUTS["photo-framed"], pages.length)); goto(at + 1); };
  const canDelete = canDeletePage(pages.length, at);
  const deleteReason = canDelete ? null : at === 0 ? "The cover cannot be deleted." : `A book needs at least ${MIN_PAGES} pages.`;
  const removePage = () => {
    if (!canDelete) return;
    onChange(deletePage(pages, at));
    goto(Math.min(at, pages.length - 2)); // the page that moves into this place, or the one before when this was the last
    setConfirmDelete(false);
  };
  // Move earlier / later (3.6d). The moved page stays selected: it is the same page, now one place along.
  const canEarlier = canMovePage(pages.length, at, -1), canLater = canMovePage(pages.length, at, 1);
  const moveReason = at === 0 ? "The cover cannot be moved."
    : !canEarlier ? "Nothing can move above the cover."
    : !canLater ? "This is already the last page." : null;
  const shiftPage = (dir: -1 | 1) => { if (!canMovePage(pages.length, at, dir)) return; onChange(movePage(pages, at, dir)); goto(at + dir); };
  // Page colour (3.6e). Only colours that keep this page's text readable are offered; a colour already chosen is always shown.
  const rawPage = pages[at];
  const bgChoices = pageBgOptions(rawPage, layout, book.palette);
  const bgIssue = rawPage.bg === undefined ? null : bgProblem(rawPage, layout, book.palette, rawPage.bg);
  const setBg = (bg: ColorRef | undefined) => { onChange(pages.map((p, i) => (i === at ? setPageBg(p, bg) : p))); };
  const copyPage = () => { if (!roomForPage) return; onChange(duplicatePage(pages, at)); goto(at + 1); };

  const currentAudio = pages[at]?.audio;
  const [pillPos, setPillPos] = useState<Record<number, PillPos>>({}); // where the creator dragged each page's voice pill (editing only)
  const chooseAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || audioBusy) return;
    const problem = audioFileProblem(file);
    if (problem) { setAudioError(problem); return; }
    const original = pagesRef.current[at], target = at;
    setAudioError(null);
    setAudioBusy({ label: "Checking audio…", pct: null });
    try {
      const duration = await readAudioDuration(file);
      if (duration > AUDIO_MAX_SECONDS) throw new Error("too-long");
      setAudioBusy({ label: "Uploading…", pct: 0 });
      const src = await uploadAudio(file, (f) => setAudioBusy({ label: "Uploading…", pct: Math.round(f * 100) }), file.name || "voice-note");
      const now = pagesRef.current;
      let i = now.indexOf(original);
      if (i < 0 && now[target] === original) i = target;
      if (i < 0) { setAudioError("That page changed while the audio was uploading. Please choose it again."); return; }
      onChange(now.map((p, k) => k === i ? { ...p, audio: { src, duration } } : p));
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setAudioError(m === "audio" || m === "duration" ? "That file could not be read as a supported audio note. Try MP3, M4A, AAC or WAV." : audioUploadMessage(m));
    } finally { setAudioBusy(null); }
  };

  const audioUploadMessage = (m: string) =>
    m === "too-long" ? "The audio note must be 3 minutes or shorter."
    : m === "not-set-up" ? "Audio notes are not set up on this site yet, so the note was not added."
    : m === "sign" || m === "network" || m === "upload" ? "The audio could not be uploaded. Check your connection and try again."
    : "That file could not be read as a supported audio note. Try MP3, M4A, AAC or WAV.";

  const startRecording = async (again = false) => {
    if (!AUDIO_ENABLED || audioBusy || (!again && recPhase !== "idle")) return;
    setRecError(null);
    setAudioError(null);
    setRecSeconds(0);
    setRecPhase("starting");
    const r = createRecorder({
      onTick: (n) => { if (recorder.current === r) { setRecSeconds(n); setRecPhase("recording"); } },
      onStop: (res) => {
        if (recorder.current !== r) return;
        recorder.current = null;
        if (takeUrl.current) URL.revokeObjectURL(takeUrl.current);
        const url = URL.createObjectURL(res.blob);
        takeUrl.current = url;
        setRecTake({ blob: res.blob, seconds: res.seconds, url, autoStopped: res.autoStopped });
        setRecPhase("review");
      },
      onError: (e) => { if (recorder.current !== r) return; recorder.current = null; setRecError(e.message); setRecPhase("idle"); setRecSeconds(0); },
    });
    recorder.current = r;
    await r.start();
    if (recorder.current === r && r.state === "recording") setRecPhase("recording"); // the first tick may be a second away
  };
  const stopRecording = () => { recorder.current?.stop(); };

  // Use the recording (9.5): the same signed upload as a chosen file. A failure keeps the old note and the recording so the creator can retry.
  const useRecording = async () => {
    if (!recTake || audioBusy) return;
    const take = recTake, original = pagesRef.current[at], target = at;
    setAudioError(null);
    setAudioBusy({ label: "Uploading…", pct: 0 });
    try {
      const src = await uploadAudio(take.blob, (f) => setAudioBusy({ label: "Uploading…", pct: Math.round(f * 100) }), "voice-note.wav");
      const now = pagesRef.current;
      let i = now.indexOf(original);
      if (i < 0 && now[target] === original) i = target;
      if (i < 0) { setAudioError("That page changed while the recording was uploading. Please record it again."); return; }
      onChange(now.map((p, k) => k === i ? { ...p, audio: { src, duration: Math.max(1, Math.min(AUDIO_MAX_SECONDS, take.seconds)) } } : p));
      dropRecording();
    } catch (err) {
      setAudioError(audioUploadMessage(err instanceof Error ? err.message : ""));
    } finally { setAudioBusy(null); }
  };

  const removeAudio = () => {
    if (!currentAudio) return;
    onChange(pages.map((p, i) => i === at ? { ...p, audio: undefined } : p));
    setAudioError(null);
  };

  // Drag-to-pan (3.5f). Only a selected photo that sticks out past its box can move; then the page canvas stops scrolling under the finger.
  // Panning is always computed from where the drag began, so fast moves between renders never lose distance.
  const drag = useRef<{ x: number; y: number; start: PhotoContent; moved: boolean } | null>(null);
  const resize = useRef<{ x: number; y: number; start: PhotoContent; moved: boolean } | null>(null);
  const textDrag = useRef<{ x: number; y: number; start: TextStyle; moved: boolean; wasSelected: boolean } | null>(null);
  // CapCut-style gestures on a selected text: two fingers pinch to scale; corner handle scales; side handle sets the width.
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; scale: number; w: number; left: number } | null>(null);
  const suppressTap = useRef(false);
  const handle = useRef<{ kind: "scale" | "width"; anchorX: number; anchorY: number; d0: number; hx0: number; scale: number; w: number; left: number } | null>(null);
  /** Scales font size and box width together (so wrapping stays the same), keeping the box inside the page. */
  const scaleText = (startScale: number, startW: number, left: number, factor: number) => {
    const maxW = Math.max(TEXT_WIDTH_MIN, 1 - left);
    const f = Math.max(Math.min(Math.max(factor, TEXT_SCALE_MIN / startScale, TEXT_WIDTH_MIN / startW), TEXT_SCALE_MAX / startScale, maxW / startW), TEXT_SCALE_MIN / startScale); // the minimum size always wins, even next to the page edge
    setStyle({ scale: Math.round(startScale * f * 1000) / 1000, w: Math.round(startW * f * 10000) / 10000 });
  };
  const FRAME_PAD = 5; // page px between the text and its selection frame
  /** The selection frame of the selected text, in page px: the real box width, hugging the text vertically. */
  const frameRect = () => {
    if (!textSlot) return null;
    const r = textSlotRect(textSlot, style, W, H), has = typed.trim().length > 0 && textFit;
    const y = has ? textFit!.y : r.y, hh = has ? textFit!.h : r.h;
    return { x: r.x - FRAME_PAD, y: y - FRAME_PAD, w: r.w + FRAME_PAD * 2, h: hh + FRAME_PAD * 2 };
  };
  const pagePoint = (e: React.PointerEvent) => {
    const b = pageBox.current!.getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * W, y: ((e.clientY - b.top) / b.height) * H };
  };
  const handleDown = (kind: "scale" | "width") => (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation(); e.preventDefault();
    const f = frameRect(), g = textGeom();
    if (!f || !g || !pageBox.current) return;
    handle.current = { kind, anchorX: f.x, anchorY: f.y, d0: Math.hypot(f.w, f.h) || 1, hx0: pagePoint(e).x, scale: g.scale, w: g.w, left: g.left };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleMove = (e: React.PointerEvent<HTMLElement>) => {
    const h = handle.current;
    if (!h) return;
    e.stopPropagation();
    const p = pagePoint(e);
    if (h.kind === "scale") scaleText(h.scale, h.w, h.left, Math.hypot(p.x - h.anchorX, p.y - h.anchorY) / h.d0);
    else setStyle({ scale: h.scale, w: Math.round(Math.min(Math.max(h.w + (p.x - h.hx0) / W, TEXT_WIDTH_MIN), Math.max(TEXT_WIDTH_MIN, 1 - h.left)) * 10000) / 10000 });
  };
  const handleUp = (e: React.PointerEvent<HTMLElement>) => { e.stopPropagation(); handle.current = null; };
  const textGeom = () => {
    if (!textSlot) return null;
    const left = textSlot.x + (style.x ?? 0);
    return { left, scale: sizeFactor(style), w: style.w ?? textSlot.w };
  };
  const decoded = photoSlot && photo.src && !isSample(photo.src) ? images.get(photo.src) : undefined;
  const imgSize = decoded ? { w: (decoded as HTMLImageElement).naturalWidth || decoded.width || 0, h: (decoded as HTMLImageElement).naturalHeight || decoded.height || 0 } : null;
  const canPan = (() => {
    if (!photoSlot || !photo.src) return false;
    if (!isSample(photo.src) && !imgSize) return false; // still loading: nothing to measure
    const o = photoOverflow(photoSlotRect(photoSlot, photo, W, H), imgSize, photo);
    return o.x > 0 || o.y > 0;
  })();
  const inEditor = (e: React.PointerEvent) => (e.target as HTMLElement).tagName === "TEXTAREA";
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inEditor(e)) return; // the text editor handles its own touches (caret placement, selection, handles)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && textSlot && !editingText) {
      // Second finger on a selected text: pinch to scale. The first finger's drag/tap is cancelled.
      const [a, b] = [...pointers.current.values()], g = textGeom();
      if (g) { pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, scale: g.scale, w: g.w, left: g.left }; textDrag.current = null; suppressTap.current = true; }
      return;
    }
    if (pointers.current.size > 1) { suppressTap.current = true; return; }
    suppressTap.current = false;
    drag.current = null;
    resize.current = null;
    textDrag.current = null;
    if (e.button !== undefined && e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H;
    const hit = editableAt(layout, pages[at], W, H, px, py, pages[at]?.styles);
    if (photoSlot) {
      const pr = photoSlotRect(photoSlot, photo, W, H), hs = Math.max(16, Math.min(28, Math.min(pr.w, pr.h) * 0.12));
      if (px >= pr.x + pr.w - hs && py >= pr.y + pr.h - hs) { resize.current = { x: e.clientX, y: e.clientY, start: photo, moved: false }; setSlotId(photoSlot.id); e.currentTarget.setPointerCapture(e.pointerId); return; }
    }
    if (hit?.kind === "text") {
      const start = pages[at]?.styles?.[hit.id] ?? {};
      textDrag.current = { x: e.clientX, y: e.clientY, start, moved: false, wasSelected: hit.id === slotId };
      setSlotId(hit.id);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (!photoSlot) return;
    const pr = photoSlotRect(photoSlot, photo, W, H);
    if (px < pr.x || px > pr.x + pr.w || py < pr.y || py > pr.y + pr.h) return;
    drag.current = { x: e.clientX, y: e.clientY, start: photo, moved: false };
    setSlotId(photoSlot.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inEditor(e)) return;
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pz = pinch.current;
    if (pz) {
      if (pointers.current.size >= 2) { const [a, b] = [...pointers.current.values()]; scaleText(pz.scale, pz.w, pz.left, (Math.hypot(a.x - b.x, a.y - b.y) || 1) / pz.dist); }
      return;
    }
    if (suppressTap.current) return;
    const rr = resize.current;
    if (rr && photoSlot) {
      const rect = e.currentTarget.getBoundingClientRect(), dx = (e.clientX - rr.x) / rect.width, dy = (e.clientY - rr.y) / rect.height;
      if (!rr.moved && Math.hypot(e.clientX - rr.x, e.clientY - rr.y) < 6) return;
      rr.moved = true;
      const sx = rr.start.x ?? photoSlot.x, sy = rr.start.y ?? photoSlot.y, sw = rr.start.w ?? photoSlot.w, sh = rr.start.h ?? photoSlot.h;
      setPhotoProps({ x: sx, y: sy, w: Math.max(0.12, Math.min(1 - sx, sw + dx)), h: Math.max(0.12, Math.min(1 - sy, sh + dy)) });
      return;
    }
    const td = textDrag.current;
    if (td && textSlot) {
      const cx = e.clientX - td.x, cy = e.clientY - td.y;
      if (!td.moved && Math.hypot(cx, cy) < 6) return;
      td.moved = true;
      const rect = e.currentTarget.getBoundingClientRect();
      setTextPositionFromStart(td.start, cx / rect.width, cy / rect.height);
      return;
    }
    const d = drag.current;
    if (!d || !photoSlot) return;
    const cx = e.clientX - d.x, cy = e.clientY - d.y;
    if (!d.moved && Math.hypot(cx, cy) < 6) return;
    d.moved = true;
    const rect = e.currentTarget.getBoundingClientRect(), dx = cx / rect.width, dy = cy / rect.height;
    const sx = d.start.x ?? photoSlot.x, sy = d.start.y ?? photoSlot.y, sw = d.start.w ?? photoSlot.w, sh = d.start.h ?? photoSlot.h;
    setPhotoProps({ x: Math.max(0, Math.min(1 - sw, sx + dx)), y: Math.max(0, Math.min(1 - sh, sy + dy)) });
  };
  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inEditor(e)) return;
    pointers.current.delete(e.pointerId);
    if (pinch.current && pointers.current.size < 2) pinch.current = null;
    if (suppressTap.current) { // a pinch or multi-finger touch never counts as a tap; wait until every finger is up
      if (pointers.current.size === 0) suppressTap.current = false;
      textDrag.current = null; drag.current = null; resize.current = null;
      return;
    }
    const wasSelectedText = textDrag.current?.wasSelected;
    const wasTextDrag = textDrag.current?.moved;
    const wasPhotoDrag = drag.current?.moved;
    const wasResize = resize.current?.moved;
    textDrag.current = null;
    drag.current = null;
    resize.current = null;
    if (wasTextDrag || wasPhotoDrag || wasResize) return;
    const r = e.currentTarget.getBoundingClientRect();
    const hit = editableAt(layout, pages[at], W, H, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H, pages[at]?.styles);
    if (hit?.kind === "text") {
      // CapCut flow: the first tap selects (frame + handles); tapping the already-selected text opens the keyboard.
      setSlotId(hit.id);
      setEditingText(!!wasSelectedText);
    } else {
      setSlotId(hit && hit.id !== slotId ? hit.id : null);
      setEditingText(false);
    }
  };

  return (
    <div style={{ ["--panel-reserve" as string]: activeTool ? "calc(var(--tool-panel-h, 208px) + 8px)" : "0px" }}>
      <div className="mx-auto w-full max-w-[360px]">
        <div ref={pageBox} className="relative mx-auto w-fit max-w-full select-none rounded-lg shadow-lg ring-1 ring-black/5" onPointerDown={down} onPointerMove={move} onPointerUp={tap} onPointerCancel={(e) => { drag.current = null; resize.current = null; textDrag.current = null; pinch.current = null; pointers.current.delete(e.pointerId); if (pointers.current.size === 0) suppressTap.current = false; }}
          style={{ touchAction: canPan || !!textSlot || !!photoSlot ? "none" : "manipulation", cursor: canPan || !!textSlot || !!photoSlot ? "grab" : undefined }}>
          <canvas ref={main} width={W * DPR} height={H * DPR} className="mx-auto block h-auto w-auto max-w-full rounded-lg" style={{ maxHeight: "min(480px, calc(100dvh - var(--hdr-h, 56px) - 4px - var(--nav-h, 76px) - var(--panel-reserve, 0px) - 8px))" }} role="img" aria-label={`Page ${at + 1} of ${filled.length}`} />
          {!ready && <p className="absolute inset-0 grid place-items-center bg-stone-100 text-sm text-stone-500" role="status">Loading the page…</p>}
          {currentAudio && !editingText && <VoiceNotePill key={`${at}:${currentAudio.src}`} src={currentAudio.src} duration={currentAudio.duration} pos={pillPos[at]} onMove={(p) => setPillPos((m) => ({ ...m, [at]: p }))} />}
          {slot && slot.kind === "photo" && (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded-sm border-2 border-rose-600 bg-rose-600/10"
              style={{
                left: `${((selectedPhotoRect?.x ?? slot.x * W) / W) * 100}%`,
                top: `${((selectedPhotoRect?.y ?? slot.y * H) / H) * 100}%`,
                width: `${((selectedPhotoRect?.w ?? slot.w * W) / W) * 100}%`,
                height: `${((selectedPhotoRect?.h ?? slot.h * H) / H) * 100}%`,
                ...(slot.rot ? { transform: `rotate(${slot.rot.deg}deg)`, transformOrigin: `${((slot.rot.cx - slot.x) / slot.w) * 100}% ${((slot.rot.cy - slot.y) / slot.h) * 100}%` } : {}),
              }}
            >
              <div aria-hidden className="pointer-events-none absolute h-4 w-4 rounded-sm border-2 border-white bg-rose-600 shadow" style={{ right: -8, bottom: -8 }} />
            </div>
          )}
          {textSlot && (() => {
            const f = frameRect();
            if (!f) return null;
            const hbtn = "pointer-events-auto absolute grid h-8 w-8 place-items-center touch-none";
            const dot = "grid place-items-center rounded-full border-2 border-rose-600 bg-white text-[11px] font-black leading-none text-rose-700 shadow";
            return (
              <div
                className="pointer-events-none absolute border-2 border-rose-600 shadow-[0_0_0_1px_rgba(255,255,255,0.85)]"
                style={{
                  left: `${(f.x / W) * 100}%`, top: `${(f.y / H) * 100}%`, width: `${(f.w / W) * 100}%`, height: `${(f.h / H) * 100}%`,
                  ...(textSlot.rot ? { transform: `rotate(${textSlot.rot.deg}deg)`, transformOrigin: `${((textSlot.rot.cx - f.x / W) / (f.w / W)) * 100}% ${((textSlot.rot.cy - f.y / H) / (f.h / H)) * 100}%` } : {}),
                }}
              >
                {!editingText && (
                  <>
                    <button type="button" aria-label="Edit text" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setEditingText(true); }} className={hbtn} style={{ right: -16, top: -16 }}><span className={dot + " h-5 w-5"}>✎</span></button>
                    <div role="slider" aria-label="Text box width" aria-valuemin={0} aria-valuenow={Math.round(((style.w ?? textSlot.w)) * 100)} onPointerDown={handleDown("width")} onPointerMove={handleMove} onPointerUp={handleUp} onPointerCancel={handleUp} className={hbtn} style={{ right: -16, top: "50%", marginTop: -16 }}><span className="h-6 w-2.5 rounded-full border-2 border-rose-600 bg-white shadow" /></div>
                    <div role="slider" aria-label="Text size" aria-valuenow={Math.round(sizeFactor(style) * 100)} onPointerDown={handleDown("scale")} onPointerMove={handleMove} onPointerUp={handleUp} onPointerCancel={handleUp} className={hbtn} style={{ right: -16, bottom: -16 }}><span className={dot + " h-5 w-5"}>⤡</span></div>
                  </>
                )}
              </div>
            );
          })()}
          {slot && !editingText && (() => {
            const r = slot.kind === "photo" ? (selectedPhotoRect ?? { x: slot.x * W, y: slot.y * H, w: slot.w * W, h: slot.h * H }) : (frameRect() ?? { x: slot.x * W, y: slot.y * H, w: slot.w * W, h: slot.h * H });
            const bw = (confirmSlotDelete ? 176 : 104) / shownScale, bh = 52 / shownScale; // the bar is a fixed size on screen, the page may be scaled
            const spot = actionBarSpot(r, otherBoxes(layout, pages[at], W, H, slot.id), W, H, bw, bh); // covers no other component (10.8c)
            const stop = (e: React.PointerEvent) => e.stopPropagation();
            const b = "pointer-events-auto grid h-11 w-11 place-items-center rounded-lg text-white disabled:opacity-40";
            return (
              <div role="toolbar" aria-label="Selected component actions" onPointerDown={stop} onPointerUp={stop} className="absolute z-10 flex gap-1 rounded-xl bg-stone-900/90 p-1 shadow-lg" style={{ left: `${(spot.x / W) * 100}%`, top: `${(spot.y / H) * 100}%` }}>
                {confirmSlotDelete ? (
                  <><span className="grid place-items-center px-2 text-xs font-bold text-white">Delete?</span><button type="button" onClick={removeComp} className={b + " bg-red-700 text-xs font-bold"} style={{ width: "auto", paddingInline: 12 }}>Yes</button><button type="button" onClick={() => setConfirmSlotDelete(false)} className={b + " text-xs font-bold"} style={{ width: "auto", paddingInline: 12 }}>Keep</button></>
                ) : (
                  <><button type="button" onClick={copyComp} disabled={!!copyWhy} aria-label="Duplicate this component" title={copyWhy ?? "Duplicate"} className={b}><Icon name="duplicate" size={18} /></button><button type="button" onClick={() => setConfirmSlotDelete(true)} disabled={!!deleteWhy} aria-label="Delete this component" title={deleteWhy ?? "Delete"} className={b}><Icon name="trash" size={18} /></button></>
                )}
              </div>
            );
          })()}
          {editBox && textSlot && (
            <textarea
              ref={textInput}
              value={typed}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setEditingText(false); textInput.current?.blur(); } }}
              maxLength={textLimit(textSlot)}
              aria-label="Edit text on page"
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck
              enterKeyHint="enter"
              className="pointer-events-auto absolute m-0 box-border resize-none overflow-x-hidden overflow-y-auto border-0 bg-transparent p-0 text-transparent caret-rose-700 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                // Laid out in page px and scaled as one unit, so font size, line height and wrapping match the canvas exactly.
                left: `${(editBox.x / W) * 100}%`, top: `${(editBox.y / H) * 100}%`,
                width: editBox.w, height: editBox.h,
                transform: `scale(${shownScale})`, transformOrigin: "0 0",
                paddingTop: editBox.padTop,
                fontFamily: editBox.family, fontWeight: editBox.weight, fontStyle: editBox.italic ? "italic" : "normal",
                fontSize: editBox.px, lineHeight: `${editBox.lineH}px`, letterSpacing: `${editBox.tracking}px`,
                textAlign: editBox.align, textTransform: editBox.upper ? "uppercase" : "none",
                whiteSpace: "pre-wrap", overflowWrap: "break-word",
                // Re-enable what the page container switches off, so the browser can place the caret and select text by touch.
                userSelect: "text", WebkitUserSelect: "text", touchAction: "manipulation",
              }}
            />
          )}
        </div>
        {activeTool && (
          <section className="fixed inset-x-0 z-20 mx-auto w-full max-w-2xl px-3" style={{ bottom: "var(--nav-h, 76px)" }} aria-label={`${activeTool} tools`}>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_-14px_44px_rgba(0,0,0,0.16)]" style={{ height: "var(--tool-panel-h, 208px)" }}>
              <div className="flex shrink-0 items-center justify-between border-b border-stone-100 pl-4 pr-1">
                <p className="text-sm font-bold text-stone-900">{activeTool === "Style" ? "Book style" : activeTool === "Audio" ? "Voice note" : activeTool}</p>
                {onClose && <button type="button" onClick={onClose} aria-label={`Close ${activeTool} tools`} className="grid h-11 w-11 place-items-center rounded-lg text-stone-500 hover:text-stone-900"><Icon name="close" size={18} /></button>}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                {activeTool === "Pages" && (
                  <div className="space-y-4">
                    <Group title="Page actions">
                      <div className="grid grid-cols-5 gap-1.5">
                        {([["Add page", "plus", addNewPage, !roomForPage], ["Duplicate", "duplicate", copyPage, !roomForPage], ["Earlier", "arrow-left", () => shiftPage(-1), !canEarlier], ["Later", "arrow-right", () => shiftPage(1), !canLater], ["Delete", "trash", () => setConfirmDelete(true), !canDelete]] as [string, IconName, () => void, boolean][]).map(([label, icon, run, off]) => (
                          <button key={label} type="button" onClick={run} disabled={off} aria-label={label === "Add page" || label === "Delete" || label === "Duplicate" ? `${label} page` : `Move page ${label.toLowerCase()}`} className={"flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg border border-stone-300 bg-white px-1 py-1 text-[10px] font-bold disabled:opacity-40 " + (label === "Delete" ? "text-red-700" : "text-stone-700")}><Icon name={icon} size={18} />{label}</button>
                        ))}
                      </div>
                      {confirmDelete && canDelete && <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3"><span className="text-xs font-bold text-red-800">Delete page {at + 1}?</span><button type="button" onClick={removePage} className="min-h-[44px] rounded-md bg-red-700 px-4 text-xs font-bold text-white">Delete</button><button type="button" onClick={() => setConfirmDelete(false)} className={chip(false)}>Keep</button></div>}
                    </Group>
                    <Group title="All pages"><ul ref={strip} className="flex gap-3 overflow-x-auto pb-2" aria-label="Pages">{filled.map((p,i)=><li key={i} className="relative shrink-0"><button type="button" onClick={()=>goto(i)} aria-current={i===at?"page":undefined} aria-label={`Go to page ${i+1}`} className={"block overflow-hidden rounded-md ring-2 transition "+(i===at?"ring-rose-700":"ring-stone-200")} style={{width:TW,height:TH}}><canvas ref={el=>{thumbs.current[i]=el}} width={W*DPR} height={H*DPR} className="block h-full w-full"/></button>{p.audio&&<span aria-hidden className="pointer-events-none absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-700 text-white"><Icon name="audio" size={11} /></span>}<span className="mt-1 block text-center text-xs text-stone-500">{i+1}</span></li>)}</ul></Group>
                    <Group title="Layout"><div className="grid grid-cols-4 gap-2">{LAYOUT_LIST.map(l=><button key={l.id} type="button" onClick={()=>chooseLayout(l.id)} aria-pressed={l.id===page.layout} className={"overflow-hidden rounded-md border-2 "+(l.id===page.layout?"border-rose-700":"border-stone-200")}><canvas ref={el=>{picks.current[l.id]=el}} width={LW} height={LH} className="block aspect-[3/4] w-full"/><span className="block truncate px-1 py-1 text-[9px] text-stone-600">{l.name}</span></button>)}</div></Group>
                  </div>
                )}
                {activeTool === "Edit" && (
                  <div className="space-y-4">
                    <Group title="Choose what to edit">
                      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Page components">{slots.map(x=><button key={x.id} type="button" onClick={()=>setSlotId(x.id)} aria-pressed={x.id===slotId} className={chip(x.id===slotId)+" flex shrink-0 items-center gap-1.5"}><Icon name={x.kind==="text"?"text":"photo"} size={14} />{slotName(layout,x)}</button>)}</div>
                    </Group>
                    <Group title="Actions">
                      {confirmSlotDelete
                        ? <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3"><span className="text-xs font-bold text-red-800">Delete this {slot?.kind==="text"?"text":"photo"}? You cannot undo it.</span><button type="button" onClick={removeComp} className="min-h-[44px] rounded-md bg-red-700 px-4 text-xs font-bold text-white">Yes, delete</button><button type="button" onClick={()=>setConfirmSlotDelete(false)} className={chip(false)}>Keep</button></div>
                        : <div className="grid grid-cols-4 gap-2" role="group" aria-label="Component actions">
                          <button type="button" onClick={copyComp} disabled={!slot||!!copyWhy} aria-label="Duplicate this component" className={"flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1 text-[11px] font-bold disabled:opacity-40 border-stone-300 bg-white text-stone-800"}><Icon name="duplicate" size={18} />Duplicate</button>
                          <button type="button" onClick={()=>setConfirmSlotDelete(true)} disabled={!slot||!!deleteWhy} aria-label="Delete this component" className={"flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1 text-[11px] font-bold disabled:opacity-40 border-stone-300 bg-white text-red-700"}><Icon name="trash" size={18} />Delete</button>
                          <button type="button" onClick={()=>addComp("text")} disabled={!!addTextWhy} aria-label="Add a text box to this page" className={"flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1 text-[11px] font-bold disabled:opacity-40 border-rose-700 bg-rose-700 text-white"}><Icon name="plus" size={18} />Add text</button>
                          <button type="button" onClick={()=>addComp("photo")} disabled={!!addTextWhy} aria-label="Add a photo to this page" className={"flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1 text-[11px] font-bold disabled:opacity-40 border-rose-700 bg-rose-700 text-white"}><Icon name="plus" size={18} />Add photo</button>
                        </div>}
                      {(slotNote||addTextWhy||deleteWhy||copyWhy)&&<p className="mt-2 text-xs text-stone-500" role="status">{slotNote??addTextWhy??deleteWhy??copyWhy}</p>}
                    </Group>
                    {textSlot && <>
                      <Group title="Text">
                        <textarea value={typed} onChange={e=>setText(e.target.value)} maxLength={textLimit(textSlot)} rows={Math.min(10, Math.max(3, typed.split("\n").reduce((n, ln) => n + Math.max(1, Math.ceil(ln.length / 32)), 0)))} placeholder={textSlot.hint} aria-label="Text on this component" className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium focus:border-stone-900 focus:outline-none"/>
                      </Group>
                      <Group title="Look">
                        <div className="flex items-center gap-3 border-t border-stone-100 first:border-t-0"><span className="w-12 shrink-0 text-xs font-bold text-stone-500">Font</span><div className="relative min-w-0 flex-1 py-1"><FontPicker family={style.family} role={cur.font ?? "body"} fonts={book.fonts} onChange={(c)=>c.family?setStyle({family:c.family}):setStyle({family:undefined,font:c.font===textSlot.font?undefined:c.font})}/></div></div>
                        <Row label="Size">{(["S","M","L"] as SizeStep[]).map(z=><button key={z} type="button" onClick={()=>setStyle({size:z==="M"?undefined:z,scale:undefined})} className={chip(style.scale===undefined&&cur.size===z)}>{z}</button>)}<input type="range" aria-label={`Size ${Math.round(sizeFactor(style)*100)}%`} min={TEXT_SCALE_MIN} max={3} step={0.05} value={Math.min(3,sizeFactor(style))} onChange={e=>{const g=textGeom(); if(g) scaleText(g.scale,g.w,g.left,Number(e.target.value)/g.scale)}} className="h-11 min-w-[96px] flex-1 accent-rose-700"/><span className="w-10 shrink-0 text-right text-xs text-stone-500">{Math.round(sizeFactor(style)*100)}%</span></Row>
                        <Row label="Style">
                          <button type="button" onClick={toggleBold} aria-pressed={cur.bold} aria-label="Bold" className={chip(cur.bold)+" grid w-11 place-items-center px-0"}><Icon name="bold" size={18} /></button>
                          <button type="button" onClick={toggleItalic} aria-pressed={cur.italic} aria-label="Italic" className={chip(cur.italic)+" grid w-11 place-items-center px-0"}><Icon name="italic" size={18} /></button>
                        </Row>
                        <Row label="Align">{([["left","Align left","align-left"],["center","Align center","align-center"],["right","Align right","align-right"],["justify","Justify","align-justify"]] as [Align,string,IconName][]).map(([a,label,icon])=><button key={a} type="button" onClick={()=>setStyle({align:a===(textSlot.align??"left")?undefined:a})} aria-pressed={cur.align===a} aria-label={label} className={chip(cur.align===a)+" grid w-11 place-items-center px-0"}><Icon name={icon} size={18} /></button>)}</Row>
                        <Row label="Colour">{TEXT_COLORS.map(([k,name])=><button key={k} type="button" aria-label={name} aria-pressed={cur.color===k} onClick={()=>setStyle({color:k===textSlot.color?undefined:k})} className="grid h-11 w-11 shrink-0 place-items-center"><span className={"block h-8 w-8 rounded-full border-2 "+(cur.color===k?"border-rose-700 ring-2 ring-rose-300":"border-stone-300")} style={{background:book.palette[k]}}/></button>)}</Row>
                      </Group>
                      <Group title="Position"><button type="button" onClick={()=>editPage(resetTextBox(pages[at],textSlot.id))} className={chip(false)}>Reset position &amp; size</button></Group>
                    </>}
                    {photoSlot && <>
                      <Group title="Photo">
                        <label className={"inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-xs font-bold text-stone-800 "+(photoBusy?"opacity-40":"")}><Icon name="photo" size={16} />Replace photo<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={choosePhoto} disabled={!!photoBusy} className="sr-only"/></label>
                        {photoBusy&&<p className="mt-2 text-xs text-stone-600" role="status">{photoBusy.label}{photoBusy.pct!==null&&` ${photoBusy.pct}%`}</p>}{photoError&&<p className="mt-2 text-xs font-bold text-red-700" role="alert">{photoError}</p>}
                      </Group>
                      <Group title="Look">
                        <Row label="Shape">{([["fill","Fill"],["fit","Fit"]] as [PhotoFit,string][]).map(([f,label])=><button key={f} type="button" onClick={()=>setPhotoProps({fit:f==="fill"?undefined:f})} className={chip((photo.fit??"fill")===f)}>{label}</button>)}</Row>
                        <Row label="Frame">{([["none","None"],["border","Border"],["rounded","Rounded"]] as [PhotoFrame,string][]).map(([f,label])=><button key={f} type="button" onClick={()=>setPhotoProps({frame:f===(photoSlot.frame??"none")?undefined:f})} className={chip((photo.frame??photoSlot.frame??"none")===f)}>{label}</button>)}</Row>
                        <Row label="Filter">{([["none","Natural"],["warm","Warm"],["bw","B&W"]] as [PhotoFilter,string][]).map(([f,label])=><button key={f} type="button" onClick={()=>setPhotoProps({filter:f==="none"?undefined:f})} className={chip((photo.filter??"none")===f)}>{label}</button>)}</Row>
                        <Row label="Zoom"><input type="range" aria-label={`Zoom ${(photo.zoom??1).toFixed(1)}×`} min={1} max={3} step={0.1} value={photo.zoom??1} onChange={e=>setPhotoProps({zoom:Number(e.target.value)})} className="h-11 min-w-[96px] flex-1 accent-rose-700"/><span className="w-10 shrink-0 text-right text-xs text-stone-500">{(photo.zoom??1).toFixed(1)}×</span><button type="button" className={chip(false)} onClick={()=>setPhotoProps({zoom:1})}>Reset</button></Row>
                      </Group>
                    </>}
                    {!textSlot&&!photoSlot&&<p className="text-xs text-stone-500">Tap a text or photo on the page, or choose one above.</p>}
                  </div>
                )}
                {activeTool === "Audio" && (
                  <div className="space-y-4">
                    {!AUDIO_ENABLED&&!currentAudio?<p className="text-xs font-bold text-stone-600">{AUDIO_OFF_REASON}</p>:<>
                      {currentAudio&&<Group title="On this page"><div className="space-y-2"><audio controls preload="metadata" src={currentAudio.src} className="w-full"/><div className="flex items-center gap-3"><span className="text-xs text-stone-500">{currentAudio.duration}s</span><button type="button" onClick={removeAudio} disabled={!!audioBusy||recPhase==="recording"} className="min-h-[44px] text-xs font-bold text-red-700 disabled:opacity-40">Remove</button></div></div></Group>}
                      <Group title={currentAudio?"Replace with":"Add a voice note"}>
                        {recPhase==="idle"&&<div className="grid grid-cols-2 gap-2"><label className={"flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 text-xs font-bold text-stone-800 "+(audioBusy?"opacity-40":"")}><Icon name="audio" size={16} />Choose file<input type="file" accept=".mp3,.m4a,.aac,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav" onChange={chooseAudio} disabled={!!audioBusy} className="sr-only"/></label>{canRecord&&<button type="button" onClick={()=>void startRecording()} disabled={!!audioBusy} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-700 px-3 text-xs font-bold text-white disabled:opacity-40"><Icon name="microphone" size={16} />Record</button>}</div>}
                        {recPhase==="starting"&&<div className="flex items-center gap-3"><span className="text-xs text-stone-600">Waiting for microphone…</span><button type="button" onClick={dropRecording} className="min-h-[44px] px-2 text-xs font-bold">Cancel</button></div>}
                        {recPhase==="recording"&&<div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-red-700">● Recording {fmtClock(recSeconds)} / {fmtClock(RECORD_MAX_SECONDS)}</span><button type="button" onClick={stopRecording} className="min-h-[44px] rounded-xl bg-rose-700 px-5 text-xs font-bold text-white">Stop</button><button type="button" onClick={dropRecording} className="min-h-[44px] px-2 text-xs font-bold">Cancel</button></div>}
                        {recPhase==="review"&&recTake&&<div className="space-y-2"><audio controls preload="metadata" src={recTake.url} className="w-full"/><div className="flex flex-wrap gap-2"><button type="button" onClick={useRecording} disabled={!!audioBusy} className="min-h-[44px] rounded-xl bg-rose-700 px-4 text-xs font-bold text-white disabled:opacity-40">Use recording</button><button type="button" onClick={()=>{dropRecording();void startRecording(true)}} className={chip(false)}>Record again</button><button type="button" onClick={dropRecording} className={chip(false)}>Discard</button></div></div>}
                        {audioBusy&&<p className="mt-2 text-xs text-stone-600" role="status">{audioBusy.label}{audioBusy.pct!==null&&` ${audioBusy.pct}%`}</p>}{(recError||audioError)&&<p className="mt-2 text-xs font-bold text-red-700" role="alert">{recError||audioError}</p>}
                      </Group>
                    </>}
                  </div>
                )}
                {activeTool === "Style" && (
                  <div className="space-y-4">
                    <Group title="Colours">
                      <div className="flex items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-full" style={{background:"conic-gradient("+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.accent) ?? book.palette.accent)+" 0 25%, "+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.accent2) ?? book.palette.accent2)+" 25% 50%, "+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.soft) ?? book.palette.soft)+" 50% 75%, "+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.ink) ?? book.palette.ink)+" 75% 100%)"}}><div className="h-8 w-8 rounded-full bg-white"/></div><div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">{PALETTE_PRESETS.map(p=><button key={p.id} type="button" onClick={()=>onStyle({paletteId:p.id})} aria-pressed={p.id===paletteId} className={chip(p.id===paletteId)+" shrink-0"}>{p.name}</button>)}</div></div>
                    </Group>
                    <Group title="Fonts"><div className="flex gap-2 overflow-x-auto">{template.fontPairs.map((fp,i)=><button key={i} type="button" onClick={()=>onStyle({fontPair:i as 0|1})} aria-pressed={fontPair===i} className={chip(fontPair===i)} style={{fontFamily:fp.display}}>{i===0?"Classic":"Modern"}</button>)}</div></Group>
                    <Group title="This page's background"><div className="flex gap-2 overflow-x-auto">{bgChoices.map(([k,name])=><button key={k} type="button" aria-label={name} aria-pressed={rawPage.bg===k} onClick={()=>setBg(k)} className={chip(rawPage.bg===k)+" shrink-0"}>{name}</button>)}</div></Group>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
