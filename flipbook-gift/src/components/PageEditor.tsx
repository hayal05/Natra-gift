"use client";
// Flat page editor (task 3.2): one page shown large, tap a slot to select it, thumbnail strip to move between pages.
// Task 3.3 adds the layout picker and 3.4 the text controls (text box in the selection card, style controls in the collapsed Customize panel).
// Task 3.5 adds photo controls (3.5b: fill/fit and frame chips, 3.5c: filter chips, 3.5d: zoom slider, 3.5f: drag the photo on the page to pan, 3.5g: choose a new photo and reset, in a "Photo" section of the Customize panel); page controls arrive in 3.6 (3.6b: Add page and Duplicate above the thumbnail strip, 3.6c: Delete with a confirm step, 3.6d: Move earlier and Move later; 3.6e: page colour in a \"Page\" section of the Customize panel); 3.7 adds the \"Book style\" panel (colours from the ten templates, two font pairs).
import { useEffect, useMemo, useRef, useState } from "react";
import { GROUP_NAMES, bgHidden, bgProblem, pageBgOptions, setPageBg, MAX_PAGES, MIN_PAGES, TEXT_COLORS, addPage, canAddPage, canDeletePage, canMovePage, deletePage, duplicatePage, editableAt, editableSlots, isAdjusted, movePage, photoFileProblem, photoOverflow, replacePhoto, resetPhoto, setPhoto, setSlotText, setTextPosition, setTextStyle, slotName, slotSummary, swapLayout, textLimit } from "../lib/editor";
import { isSample, loadFonts, loadImages, renderPage, photoSlotRect, slotRect, type Align, type ColorRef, type FontRole, type ImageMap, type PageData, type Palette, type PhotoContent, type PhotoFilter, type PhotoFit, type PhotoFrame, type SizeStep, type TextStyle } from "../lib/pages";
import { PALETTE_PRESETS } from "../lib/draft";
import { UPLOADS_ENABLED, blobToDataUri, resizePhoto, uploadPhoto } from "../lib/photo";
import { AUDIO_ENABLED, AUDIO_MAX_SECONDS, AUDIO_OFF_REASON, RECORD_MAX_SECONDS, audioFileProblem, readAudioDuration, recordingSupported, uploadAudio } from "../lib/audio";
import { createRecorder, type Recorder } from "../audio/recorder";
import { LAYOUTS, LAYOUT_LIST, bookStyle, fillPages, type Template } from "../templates";

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
  activeTool?: "Pages" | "Text" | "Media" | "Audio" | "Record" | "Style" | null;
}

export default function PageEditor({ template, pages, to, from, fontPair, palette, paletteId, onStyle, onChange, active = true, activeTool = null }: Props) {
  const [index, setIndex] = useState(0);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [images, setImages] = useState<ImageMap>(() => new Map());
  const main = useRef<HTMLCanvasElement>(null);
  const thumbs = useRef<(HTMLCanvasElement | null)[]>([]);
  const strip = useRef<HTMLUListElement>(null);
  const picks = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState<{ label: string; pct: number | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
  const slots = editableSlots(layout);
  const slot = slots.find((s) => s.id === slotId) ?? null;

  useEffect(() => { let alive = true; loadFonts(book.fonts).then(() => alive && setReady(true)); return () => { alive = false; }; }, [book]);
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
  }, [ready, book, filled, images, page, at]);

  // Layout picker previews: every layout drawn with this page's content. Only while the panel is open.
  useEffect(() => {
    if (!ready || !panelOpen) return;
    for (const l of LAYOUT_LIST) {
      const cv = picks.current[l.id], c = cv?.getContext("2d");
      if (!cv || !c) continue;
      c.setTransform(1, 0, 0, 1, 0, 0);
      renderPage(c, LW, LH, swapLayout(page, l, at), l, book, images, at);
    }
  }, [ready, panelOpen, book, page, at, images]);

  const chooseLayout = (id: string) => {
    const next = LAYOUTS[id];
    if (!next || next.id === page.layout) return;
    onChange(pages.map((p, i) => (i === at ? swapLayout(p, next, at) : p)));
    setSlotId(null);
  };

  const textSlot = slot && slot.kind === "text" ? slot : null;
  const style: TextStyle = (textSlot && pages[at]?.styles?.[textSlot.id]) || {};
  const typed = textSlot ? (typeof page.slots[textSlot.id] === "string" ? (page.slots[textSlot.id] as string) : "") : "";
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const photoSlot = slot && slot.kind === "photo" ? slot : null;
  const rawPhoto = photoSlot ? pages[at]?.slots[photoSlot.id] : undefined;
  const photo: PhotoContent = typeof rawPhoto === "object" && rawPhoto ? rawPhoto : { src: "" };
  const editPage = (next: PageData) => onChange(pages.map((p, i) => (i === at ? next : p)));
  const setText = (v: string) => textSlot && editPage(setSlotText(pages[at], textSlot, v));
  const setPhotoProps = (patch: Partial<PhotoContent>) => photoSlot && editPage(setPhoto(pages[at], photoSlot.id, patch));
  const setStyle = (patch: Partial<TextStyle>) => textSlot && editPage(setTextStyle(pages[at], textSlot.id, patch));
  const setTextPositionFromStart = (start: TextStyle, dx: number, dy: number) =>
    textSlot && editPage(setTextPosition(pages[at], textSlot.id, (start.x ?? 0) + dx, (start.y ?? 0) + dy));
  // Picking the layout's own value clears the override, so "reset" is just choosing the default again.
  const cur = {
    font: style.font ?? textSlot?.font, size: style.size ?? "M", align: style.align ?? textSlot?.align ?? "left", color: style.color ?? textSlot?.color,
  };
  const chip = (on: boolean) => "rounded-md border px-3 py-1.5 text-xs font-bold transition " + (on ? "border-rose-700 bg-rose-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500");

  useEffect(() => { setPhotoError(null); }, [slotId, index]);
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
  useEffect(() => () => dropRef.current(), []); // unmount
  useEffect(() => { setConfirmDelete(false); }, [index, pages.length]); // a pending question never follows the creator to another page

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

  const goto = (i: number) => { setIndex(i); setSlotId(null); };
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
  const textDrag = useRef<{ x: number; y: number; start: TextStyle; moved: boolean } | null>(null);
  const decoded = photoSlot && photo.src && !isSample(photo.src) ? images.get(photo.src) : undefined;
  const imgSize = decoded ? { w: (decoded as HTMLImageElement).naturalWidth || decoded.width || 0, h: (decoded as HTMLImageElement).naturalHeight || decoded.height || 0 } : null;
  const canPan = (() => {
    if (!photoSlot || !photo.src) return false;
    if (!isSample(photo.src) && !imgSize) return false; // still loading: nothing to measure
    const o = photoOverflow(photoBox(photoSlot, photo.frame, W, H), imgSize, photo);
    return o.x > 0 || o.y > 0;
  })();
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    resize.current = null;
    textDrag.current = null;
    if (e.button !== undefined && e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H;
    const hit = editableAt(layout, W, H, px, py, pages[at]?.styles);
    if (photoSlot) {
      const pr = photoSlotRect(photoSlot, photo, W, H), hs = Math.max(16, Math.min(28, Math.min(pr.w, pr.h) * 0.12));
      if (px >= pr.x + pr.w - hs && py >= pr.y + pr.h - hs) { resize.current = { x: e.clientX, y: e.clientY, start: photo, moved: false }; setSlotId(photoSlot.id); e.currentTarget.setPointerCapture(e.pointerId); return; }
    }
    if (hit?.kind === "text") {
      const start = pages[at]?.styles?.[hit.id] ?? {};
      textDrag.current = { x: e.clientX, y: e.clientY, start, moved: false };
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
    const wasTextDrag = textDrag.current?.moved;
    const wasPhotoDrag = drag.current?.moved;
    const wasResize = resize.current?.moved;
    textDrag.current = null;
    drag.current = null;
    resize.current = null;
    if (wasTextDrag || wasPhotoDrag || wasResize) return;
    const r = e.currentTarget.getBoundingClientRect();
    const hit = editableAt(layout, W, H, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H, pages[at]?.styles);
    setSlotId(hit && hit.id !== slotId ? hit.id : null);
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-[360px]">
        <div className="relative select-none overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5" onPointerDown={down} onPointerMove={move} onPointerUp={tap} onPointerCancel={() => { drag.current = null; resize.current = null; textDrag.current = null; }}
          style={{ touchAction: canPan || !!textSlot || !!photoSlot ? "none" : "manipulation", cursor: canPan || !!textSlot || !!photoSlot ? "grab" : undefined }}>
          <canvas ref={main} width={W * DPR} height={H * DPR} className="mx-auto block h-auto w-auto max-w-full" style={{ maxHeight: "min(480px, calc(70dvh - 70px))" }} role="img" aria-label={`Page ${at + 1} of ${filled.length}`} />
          {!ready && <p className="absolute inset-0 grid place-items-center bg-stone-100 text-sm text-stone-500" role="status">Loading the page…</p>}
          {slot && (
            <div aria-hidden className="pointer-events-none absolute rounded-sm border-2 border-rose-600 bg-rose-600/10"
              style={{
                left: `${((slot.kind === "photo" ? selectedPhotoRect?.x ?? slot.x * W : slot.x * W) / W + (slot.kind === "text" ? (pages[at]?.styles?.[slot.id]?.x ?? 0) : 0)) * 100}%`, top: `${((slot.kind === "photo" ? selectedPhotoRect?.y ?? slot.y * H : slot.y * H) / H + (slot.kind === "text" ? (pages[at]?.styles?.[slot.id]?.y ?? 0) : 0)) * 100}%`, width: `${(slot.kind === "photo" ? (selectedPhotoRect?.w ?? slot.w * W) / W : slot.w) * 100}%`, height: `${(slot.kind === "photo" ? (selectedPhotoRect?.h ?? slot.h * H) / H : slot.h) * 100}%`,
                ...(slot.rot ? { transform: `rotate(${slot.rot.deg}deg)`, transformOrigin: `${((slot.rot.cx - slot.x) / slot.w) * 100}% ${((slot.rot.cy - slot.y) / slot.h) * 100}%` } : {}),
              }}></div>
            {slot.kind === "photo" && <div aria-hidden className="pointer-events-none absolute h-4 w-4 rounded-sm border-2 border-white bg-rose-600 shadow" style={{ left: "calc(100% - 8px)", top: "calc(100% - 8px)" }}></div>}
          )}
        </div>
        {activeTool && (
          <section className="fixed inset-x-0 bottom-[76px] z-20 mx-auto w-full max-w-2xl px-3" aria-label={`${activeTool} tools`}>
            <div className="max-h-[30vh] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_-14px_44px_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                <div><p className="text-sm font-bold text-stone-900">{activeTool === "Record" ? "Voice record" : activeTool === "Style" ? "Book style" : activeTool}</p><p className="text-[11px] text-stone-400">Focused tool workspace</p></div>
              </div>
              <div className="max-h-[22vh] overflow-y-auto px-4 py-3">
                {activeTool === "Pages" && (
                  <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Primary page actions"><button type="button" onClick={addNewPage} disabled={!roomForPage} className={chip(false)+" shrink-0 disabled:opacity-40"}>＋ Add page</button><button type="button" onClick={copyPage} disabled={!roomForPage} className={chip(false)+" shrink-0 disabled:opacity-40"}>Duplicate</button></div><details className="rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Page actions</summary><div className="flex flex-wrap gap-2 border-t border-stone-200 px-3 py-2"><button type="button" onClick={() => shiftPage(-1)} disabled={!canEarlier} className={chip(false)+" disabled:opacity-40"}>← Earlier</button><button type="button" onClick={() => shiftPage(1)} disabled={!canLater} className={chip(false)+" disabled:opacity-40"}>Later →</button>{!confirmDelete && <button type="button" onClick={() => setConfirmDelete(true)} disabled={!canDelete} className={chip(false)+" disabled:opacity-40"}>Delete</button>}</div></details>
                    {confirmDelete && canDelete && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3"><span className="text-xs font-bold text-red-800">Delete page {at + 1}?</span><button type="button" onClick={removePage} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-bold text-white">Delete</button><button type="button" onClick={() => setConfirmDelete(false)} className={chip(false)}>Keep</button></div>}
                    <div><p className="mb-2 text-xs font-bold text-stone-500">Pages</p><ul ref={strip} className="flex gap-3 overflow-x-auto pb-2" aria-label="Pages">{filled.map((p,i)=><li key={i} className="relative shrink-0"><button type="button" onClick={()=>goto(i)} aria-current={i===at?"page":undefined} className={"block overflow-hidden rounded-md ring-2 transition "+(i===at?"ring-rose-700":"ring-stone-200")} style={{width:TW,height:TH}}><canvas ref={el=>{thumbs.current[i]=el}} width={W*DPR} height={H*DPR} className="block h-full w-full"/></button>{p.audio&&<span aria-hidden className="pointer-events-none absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-700 text-[11px] text-white">♪</span>}<span className="mt-1 block text-center text-xs text-stone-500">{i+1}</span></li>)}</ul></div>
                    <details className="rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Layout</summary><div className="grid grid-cols-4 gap-2 border-t border-stone-200 p-2">{LAYOUT_LIST.map(l=><button key={l.id} type="button" onClick={()=>chooseLayout(l.id)} aria-pressed={l.id===page.layout} className={"overflow-hidden rounded-md border-2 "+(l.id===page.layout?"border-rose-700":"border-stone-200")}><canvas ref={el=>{picks.current[l.id]=el}} width={LW} height={LH} className="block aspect-[3/4] w-full"/><span className="block truncate px-1 py-1 text-[9px] text-stone-600">{l.name}</span></button>)}</div></details>
                  </div>
                )}
                {activeTool === "Text" && (
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Text elements">{slots.filter(x=>x.kind==="text").map(x=><button key={x.id} type="button" onClick={()=>setSlotId(x.id)} className={chip(x.id===slotId)}>{slotName(layout,x)}</button>)}</div>
                    {textSlot ? <><div className="rounded-xl border border-stone-200 bg-stone-50 p-2"><textarea value={typed} onChange={e=>setText(e.target.value)} maxLength={textLimit(textSlot)} rows={3} placeholder={textSlot.hint} aria-label="Text board" className="w-full resize-none rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-medium focus:outline-none"/><details className="mt-2 rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Fonts</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{([["display","Headline"],["body","Reading"]] as [FontRole,string][]).map(([r,label])=><button key={r} type="button" onClick={()=>setStyle({font:r===textSlot.font?undefined:r})} className={chip(cur.font===r)}>{label}</button>)}</div></details><details className="mt-2 rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Size & alignment</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{(["S","M","L"] as SizeStep[]).map(z=><button key={z} type="button" onClick={()=>setStyle({size:z==="M"?undefined:z})} className={chip(cur.size===z)}>{z}</button>)}{(["left","center","right"] as Align[]).map(a=><button key={a} type="button" onClick={()=>setStyle({align:a===(textSlot.align??"left")?undefined:a})} className={chip(cur.align===a)+" capitalize"}>{a}</button>)}</div></details></div><details className="mt-2 rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Color</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{TEXT_COLORS.map(([k,name])=><button key={k} type="button" aria-label={name} onClick={()=>setStyle({color:k===textSlot.color?undefined:k})} className={"h-9 w-9 shrink-0 rounded-full border-2 "+(cur.color===k?"border-rose-700 ring-2 ring-rose-300":"border-stone-300")} style={{background:book.palette[k]}}/>)}</div></details></> : <p className="text-xs text-stone-500">Choose a text element above.</p>}
                  </div>
                )}
                {activeTool === "Media" && (
                  <div className="space-y-3">
                    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Photo elements">{slots.filter(x=>x.kind==="photo").map(x=><button key={x.id} type="button" onClick={()=>setSlotId(x.id)} className={chip(x.id===slotId)}>{slotName(layout,x)}</button>)}</div>
                    {photoSlot ? <><label className={"inline-block cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold "+(photoBusy?"opacity-40":"")}>Choose photo<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={choosePhoto} disabled={!!photoBusy} className="sr-only"/></label><details className="mt-2 rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Adjust</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{([["fill","Fill"],["fit","Fit"]] as [PhotoFit,string][]).map(([f,label])=><button key={f} type="button" onClick={()=>setPhotoProps({fit:f==="fill"?undefined:f})} className={chip((photo.fit??"fill")===f)}>{label}</button>)}<button type="button" className={chip(false)} onClick={()=>setPhotoProps({zoom:1})}>Reset zoom</button></div><label className="block border-t border-stone-200 px-3 py-2 text-xs font-bold text-stone-600">Zoom {(photo.zoom??1).toFixed(1)}×<input type="range" min={1} max={3} step={0.1} value={photo.zoom??1} onChange={e=>setPhotoProps({zoom:Number(e.target.value)})} className="mt-2 w-full accent-rose-700"/></label></details><details className="mt-2 rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Filter</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{([["none","Natural"],["warm","Warm"],["bw","B&W"]] as [PhotoFilter,string][]).map(([f,label])=><button key={f} type="button" onClick={()=>setPhotoProps({filter:f==="none"?undefined:f})} className={chip((photo.filter??"none")===f)}>{label}</button>)}</div></details><details className="mt-2 rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Frame</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{([["none","No frame"],["border","Border"],["rounded","Rounded"]] as [PhotoFrame,string][]).map(([f,label])=><button key={f} type="button" onClick={()=>setPhotoProps({frame:f===(photoSlot.frame??"none")?undefined:f})} className={chip((photo.frame??photoSlot.frame??"none")===f)}>{label}</button>)}</div></details></> : <p className="text-xs text-stone-500">Choose a photo element above.</p>}
                    {photoBusy&&<p className="text-xs text-stone-600" role="status">{photoBusy.label}{photoBusy.pct!==null&&` ${photoBusy.pct}%`}</p>}{photoError&&<p className="text-xs font-bold text-red-700" role="alert">{photoError}</p>}
                  </div>
                )}
                {(activeTool === "Audio" || activeTool === "Record") && (
                  <div className="space-y-3">
                    {!AUDIO_ENABLED&&!currentAudio?<p className="text-xs font-bold text-stone-600">{AUDIO_OFF_REASON}</p>:<>{currentAudio&&<div className="space-y-2"><audio controls preload="metadata" src={currentAudio.src} className="w-full"/><div className="flex items-center gap-2"><span className="text-xs text-stone-500">{currentAudio.duration}s</span><button type="button" onClick={removeAudio} disabled={!!audioBusy||recPhase==="recording"} className="text-xs font-bold text-red-700">Remove</button></div></div>}{activeTool==="Audio"&&recPhase==="idle"&&<div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-xl border border-stone-200 px-4 py-2 text-xs font-bold">Choose audio<input type="file" accept=".mp3,.m4a,.aac,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/x-wav" onChange={chooseAudio} disabled={!!audioBusy} className="sr-only"/></label>{canRecord&&<button type="button" onClick={()=>void startRecording()} disabled={!!audioBusy} className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white">Record</button>}</div>}{activeTool==="Record"&&recPhase==="idle"&&canRecord&&<button type="button" onClick={()=>void startRecording()} disabled={!!audioBusy} className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white">● Start recording</button>}{recPhase==="starting"&&<div className="flex items-center gap-2"><span className="text-xs text-stone-600">Waiting for microphone…</span><button type="button" onClick={dropRecording} className="text-xs font-bold">Cancel</button></div>}{recPhase==="recording"&&<div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-red-700">● {fmtClock(recSeconds)} / {fmtClock(RECORD_MAX_SECONDS)}</span><button type="button" onClick={stopRecording} className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white">Stop</button><button type="button" onClick={dropRecording} className="text-xs font-bold">Cancel</button></div>}{recPhase==="review"&&recTake&&<div className="space-y-2"><audio controls preload="metadata" src={recTake.url} className="w-full"/><div className="flex flex-wrap gap-2"><button type="button" onClick={useRecording} disabled={!!audioBusy} className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white">Use recording</button><button type="button" onClick={()=>{dropRecording();void startRecording(true)}} className={chip(false)}>Record again</button><button type="button" onClick={dropRecording} className={chip(false)}>Discard</button></div></div>}{audioBusy&&<p className="text-xs text-stone-600" role="status">{audioBusy.label}{audioBusy.pct!==null&&` ${audioBusy.pct}%`}</p>}{(recError||audioError)&&<p className="text-xs font-bold text-red-700" role="alert">{recError||audioError}</p>}</>}
                  </div>
                )}
                {activeTool === "Style" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-3"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{background:"conic-gradient("+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.accent) ?? book.palette.accent)+" 0 25%, "+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.accent2) ?? book.palette.accent2)+" 25% 50%, "+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.soft) ?? book.palette.soft)+" 50% 75%, "+((PALETTE_PRESETS.find(p=>p.id===paletteId)?.palette.ink) ?? book.palette.ink)+" 75% 100%)"}}><div className="h-9 w-9 rounded-full bg-white"/></div><div className="min-w-0 flex-1"><p className="mb-2 text-xs font-bold text-stone-500">Colour palette</p><div className="flex gap-2 overflow-x-auto">{PALETTE_PRESETS.map(p=><button key={p.id} type="button" onClick={()=>onStyle({paletteId:p.id})} className={chip(p.id===paletteId)}>{p.name}</button>)}</div></div></div>
                    <details className="rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Fonts</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{template.fontPairs.map((fp,i)=><button key={i} type="button" onClick={()=>onStyle({fontPair:i as 0|1})} className={chip(fontPair===i)} style={{fontFamily:fp.display}}>{i===0?"Classic":"Modern"}</button>)}</div></details>
                    <details className="rounded-xl border border-stone-200 bg-white"><summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold text-stone-700">Background</summary><div className="flex gap-2 overflow-x-auto border-t border-stone-200 px-3 py-2">{bgChoices.map(([k,name])=><button key={k} type="button" aria-label={name} onClick={()=>setBg(k)} className={chip(rawPage.bg===k)}>{name}</button>)}</div></details>
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
