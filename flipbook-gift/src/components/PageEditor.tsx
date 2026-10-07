"use client";
// Flat page editor (task 3.2): one page shown large, tap a slot to select it, thumbnail strip to move between pages.
// Task 3.3 adds the layout picker and 3.4 the text controls (text box in the selection card, style controls in the collapsed Customize panel).
// Task 3.5 adds photo controls (3.5b: fill/fit and frame chips, 3.5c: filter chips, 3.5d: zoom slider, 3.5f: drag the photo on the page to pan, 3.5g: choose a new photo and reset, in a "Photo" section of the Customize panel); page controls arrive in 3.6 (3.6b: Add page and Duplicate above the thumbnail strip, 3.6c: Delete with a confirm step, 3.6d: Move earlier and Move later; 3.6e: page colour in a \"Page\" section of the Customize panel); 3.7 adds the \"Book style\" panel (colours from the ten templates, two font pairs).
import { useEffect, useMemo, useRef, useState } from "react";
import { GROUP_NAMES, bgHidden, bgProblem, pageBgOptions, setPageBg, MAX_PAGES, MIN_PAGES, TEXT_COLORS, addPage, canAddPage, canDeletePage, canMovePage, deletePage, duplicatePage, editableAt, editableSlots, isAdjusted, movePage, panBy, photoBox, photoFileProblem, photoOverflow, replacePhoto, resetPhoto, setPhoto, setSlotText, setTextStyle, slotName, slotSummary, swapLayout, textLimit } from "../lib/editor";
import { isSample, loadFonts, loadImages, renderPage, slotRect, type Align, type ColorRef, type FontRole, type ImageMap, type PageData, type Palette, type PhotoContent, type PhotoFilter, type PhotoFit, type PhotoFrame, type SizeStep, type TextStyle } from "../lib/pages";
import { PALETTE_PRESETS } from "../lib/draft";
import { UPLOADS_ENABLED, blobToDataUri, resizePhoto, uploadPhoto } from "../lib/photo";
import { AUDIO_MAX_SECONDS, audioFileProblem, readAudioDuration, uploadAudio } from "../lib/audio";
import { LAYOUTS, LAYOUT_LIST, bookStyle, fillPages, type Template } from "../templates";

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
}

export default function PageEditor({ template, pages, to, from, fontPair, palette, paletteId, onStyle, onChange }: Props) {
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
  // Picking the layout's own value clears the override, so "reset" is just choosing the default again.
  const cur = {
    font: style.font ?? textSlot?.font, size: style.size ?? "M", align: style.align ?? textSlot?.align ?? "left", color: style.color ?? textSlot?.color,
  };
  const chip = (on: boolean) => "rounded-md border px-3 py-1.5 text-xs font-bold transition " + (on ? "border-rose-700 bg-rose-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500");

  useEffect(() => { setPhotoError(null); }, [slotId, index]);
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
      const src = await uploadAudio(file, (f) => setAudioBusy({ label: "Uploading…", pct: Math.round(f * 100) }));
      const now = pagesRef.current;
      let i = now.indexOf(original);
      if (i < 0 && now[target] === original) i = target;
      if (i < 0) { setAudioError("That page changed while the audio was uploading. Please choose it again."); return; }
      onChange(now.map((p, k) => k === i ? { ...p, audio: { src, duration } } : p));
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setAudioError(
        m === "too-long" ? "The audio note must be 3 minutes or shorter."
        : m === "sign" || m === "network" || m === "upload" ? "The audio could not be uploaded. Check your connection and try again."
        : "That file could not be read as an MP3 audio note."
      );
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
    if (!photoSlot || !canPan || (e.button !== undefined && e.button !== 0)) return;
    const r = e.currentTarget.getBoundingClientRect(), pr = slotRect(photoSlot, W, H);
    const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H;
    if (px < pr.x || px > pr.x + pr.w || py < pr.y || py > pr.y + pr.h) return; // only a drag that starts on the photo moves it
    drag.current = { x: e.clientX, y: e.clientY, start: photo, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !photoSlot) return;
    const cx = e.clientX - d.x, cy = e.clientY - d.y;
    if (!d.moved && Math.hypot(cx, cy) < 6) return; // a small wobble is still a tap
    d.moved = true;
    const k = W / e.currentTarget.getBoundingClientRect().width; // screen pixels to page units
    setPhotoProps(panBy(d.start, cx * k, cy * k, photoBox(photoSlot, d.start.frame, W, H), imgSize));
  };
  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasDrag = drag.current?.moved;
    drag.current = null;
    if (wasDrag) return; // the finger moved the photo; that is not a tap
    const r = e.currentTarget.getBoundingClientRect();
    const hit = editableAt(layout, W, H, ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
    setSlotId(hit && hit.id !== slotId ? hit.id : null);
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-[360px]">
        <div className="relative select-none overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5" onPointerDown={down} onPointerMove={move} onPointerUp={tap} onPointerCancel={() => { drag.current = null; }}
          style={{ touchAction: canPan ? "none" : "manipulation", cursor: canPan ? "grab" : undefined }}>
          <canvas ref={main} width={W * DPR} height={H * DPR} className="block aspect-[3/4] w-full" role="img" aria-label={`Page ${at + 1} of ${filled.length}`} />
          {!ready && <p className="absolute inset-0 grid place-items-center bg-stone-100 text-sm text-stone-500" role="status">Loading the page…</p>}
          {slot && (
            <div aria-hidden className="pointer-events-none absolute rounded-sm border-2 border-rose-600 bg-rose-600/10"
              style={{
                left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.w * 100}%`, height: `${slot.h * 100}%`,
                ...(slot.rot ? { transform: `rotate(${slot.rot.deg}deg)`, transformOrigin: `${((slot.rot.cx - slot.x) / slot.w) * 100}% ${((slot.rot.cy - slot.y) / slot.h) * 100}%` } : {}),
              }} />
          )}
        </div>
        <p className="mt-3 text-center text-sm text-stone-500">Page {at + 1} of {filled.length}. Tap a part of the page to select it.</p>

        <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Parts of this page">
          {slots.map((s) => (
            <button key={s.id} type="button" aria-pressed={s.id === slotId} onClick={() => setSlotId(s.id === slotId ? null : s.id)}
              className={"rounded-full border px-3 py-1.5 text-xs font-bold transition " + (s.id === slotId ? "border-rose-700 bg-rose-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500")}>
              {slotName(layout, s)}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-[3.5rem] rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm" role="status">
          {slot ? (
            <><p className="font-bold text-stone-900">{slotName(layout, slot)}</p><p className="mt-0.5 break-words text-stone-600">{slotSummary(slot, page)}</p></>
          ) : <p className="text-stone-500">Nothing selected.</p>}
          {photoSlot && (
            <div className="mt-2">
              <label className={"inline-block rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 transition focus-within:ring-2 focus-within:ring-rose-300 " + (photoBusy ? "cursor-wait opacity-50" : "cursor-pointer hover:border-stone-500")}>
                Choose photo
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={choosePhoto} disabled={!!photoBusy} className="sr-only" />
              </label>
              {photoBusy && (
                <div className="mt-2" role="status" aria-live="polite">
                  <p className="text-xs text-stone-600">{photoBusy.label}{photoBusy.pct !== null && ` ${photoBusy.pct}%`}</p>
                  <progress className="mt-1 h-2 w-full max-w-[240px]" max={100} {...(photoBusy.pct !== null ? { value: photoBusy.pct } : {})} />
                </div>
              )}
              {photoError && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{photoError}</p>}
            </div>
          )}
          <div className="mt-3 border-t border-stone-200 pt-3">
            <p className="font-bold text-stone-900">Audio note</p>
            <p className="mt-0.5 text-xs text-stone-500">Add one MP3 voice note to this page. Maximum 5 MB and 3 minutes.</p>
            {currentAudio ? (
              <div className="mt-2 space-y-2">
                <audio controls preload="metadata" src={currentAudio.src} className="w-full" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-stone-500">{currentAudio.duration}s audio note</span>
                  <button type="button" onClick={removeAudio} disabled={!!audioBusy} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:border-red-300">Remove audio</button>
                </div>
              </div>
            ) : (
              <label className={"mt-2 inline-block rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 transition focus-within:ring-2 focus-within:ring-rose-300 " + (audioBusy ? "cursor-wait opacity-50" : "cursor-pointer hover:border-stone-500")}>
                Add MP3 voice note
                <input type="file" accept="audio/mpeg,audio/mp3,.mp3" onChange={chooseAudio} disabled={!!audioBusy} className="sr-only" />
              </label>
            )}
            {audioBusy && (
              <div className="mt-2" role="status" aria-live="polite">
                <p className="text-xs text-stone-600">{audioBusy.label}{audioBusy.pct !== null && ` ${audioBusy.pct}%`}</p>
                <progress className="mt-1 h-2 w-full max-w-[240px]" max={100} {...(audioBusy.pct !== null ? { value: audioBusy.pct } : {})} />
              </div>
            )}
            {audioError && <p role="alert" className="mt-2 text-xs font-bold text-red-700">{audioError}</p>}
          </div>

          {textSlot && (
            <label className="mt-2 block">
              <span className="sr-only">Text for {slotName(layout, textSlot)}</span>
              <textarea value={typed} onChange={(e) => setText(e.target.value)} maxLength={textLimit(textSlot)} rows={textSlot.h > 0.15 ? 5 : 2} placeholder={textSlot.hint}
                className="w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-rose-700 focus:outline-none focus:ring-1 focus:ring-rose-700" />
              <span className="mt-0.5 block text-right text-xs text-stone-500">{typed.length} / {textLimit(textSlot)}</span>
            </label>
          )}
        </div>

        <details className="mt-3 rounded-lg border border-stone-200 bg-white" onToggle={(e) => setPanelOpen(e.currentTarget.open)}>
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-stone-800">Customize this page</summary>
          <div className="border-t border-stone-200 px-4 py-4">
            <h2 className="text-sm font-bold text-stone-900">Text style</h2>
            {textSlot ? (
              <div className="mt-2 space-y-3">
                <p className="text-xs text-stone-500">For “{slotName(layout, textSlot)}”.</p>
                <div role="group" aria-label="Font" className="flex flex-wrap gap-2">
                  {(["display", "body"] as FontRole[]).map((r) => (
                    <button key={r} type="button" aria-pressed={cur.font === r} onClick={() => setStyle({ font: r === textSlot.font ? undefined : r })} className={chip(cur.font === r)} style={{ fontFamily: book.fonts[r] }}>
                      {r === "display" ? "Headline font" : "Reading font"}
                    </button>
                  ))}
                </div>
                <div role="group" aria-label="Size" className="flex gap-2">
                  {(["S", "M", "L"] as SizeStep[]).map((z) => (
                    <button key={z} type="button" aria-pressed={cur.size === z} aria-label={{ S: "Small", M: "Medium", L: "Large" }[z]} onClick={() => setStyle({ size: z === "M" ? undefined : z })} className={chip(cur.size === z) + " w-12"}>{z}</button>
                  ))}
                </div>
                <div role="group" aria-label="Alignment" className="flex gap-2">
                  {(["left", "center", "right"] as Align[]).map((a) => (
                    <button key={a} type="button" aria-pressed={cur.align === a} onClick={() => setStyle({ align: a === (textSlot.align ?? "left") ? undefined : a })} className={chip(cur.align === a) + " capitalize"}>{a}</button>
                  ))}
                </div>
                <div role="group" aria-label="Colour" className="flex flex-wrap gap-3">
                  {TEXT_COLORS.map(([k, name]) => (
                    <button key={k} type="button" aria-pressed={cur.color === k} aria-label={name} title={name} onClick={() => setStyle({ color: k === textSlot.color ? undefined : k })}
                      className={"h-8 w-8 rounded-full border-2 transition " + (cur.color === k ? "border-rose-700 ring-2 ring-rose-300" : "border-stone-300 hover:border-stone-500")} style={{ background: book.palette[k] }} />
                  ))}
                </div>
                {Object.keys(style).length > 0 && (
                  <button type="button" onClick={() => editPage(setTextStyle(pages[at], textSlot.id, { font: undefined, size: undefined, align: undefined, color: undefined }))} className="text-xs font-bold text-rose-700 underline">Reset this text's style</button>
                )}
              </div>
            ) : <p className="mt-1 text-xs text-stone-500">Tap a piece of text on the page to change its font, size, alignment or colour.</p>}

            <h2 className="mt-6 border-t border-stone-200 pt-4 text-sm font-bold text-stone-900">Photo</h2>
            {photoSlot ? (
              <div className="mt-2 space-y-3">
                <p className="text-xs text-stone-500">For “{slotName(layout, photoSlot)}”.</p>
                <div role="group" aria-label="Photo size" className="flex gap-2">
                  {([["fill", "Fill the space"], ["fit", "Show whole photo"]] as [PhotoFit, string][]).map(([f, label]) => (
                    <button key={f} type="button" aria-pressed={(photo.fit ?? "fill") === f} onClick={() => setPhotoProps({ fit: f === "fill" ? undefined : f })} className={chip((photo.fit ?? "fill") === f)}>{label}</button>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="photo-zoom" className="text-xs font-bold text-stone-700">Zoom {(photo.zoom ?? 1).toFixed(1)}×</label>
                    {photo.zoom !== undefined && <button type="button" onClick={() => setPhotoProps({ zoom: undefined })} className="text-xs font-bold text-rose-700 underline">Reset to 1×</button>}
                  </div>
                  <input id="photo-zoom" type="range" min={1} max={3} step={0.1} value={photo.zoom ?? 1} onChange={(e) => setPhotoProps({ zoom: Number(e.target.value) })} className="mt-1 w-full accent-rose-700" />
                  <p className="mt-0.5 text-xs text-stone-500">Zoom in, then drag the photo to move it.</p>
                </div>
                <div role="group" aria-label="Filter" className="flex flex-wrap gap-2">
                  {([["none", "No filter"], ["warm", "Warm"], ["bw", "Black & white"]] as [PhotoFilter, string][]).map(([f, label]) => (
                    <button key={f} type="button" aria-pressed={(photo.filter ?? "none") === f} onClick={() => setPhotoProps({ filter: f === "none" ? undefined : f })} className={chip((photo.filter ?? "none") === f)}>{label}</button>
                  ))}
                </div>
                <div role="group" aria-label="Frame" className="flex gap-2">
                  {([["none", "No frame"], ["border", "Border"], ["rounded", "Rounded"]] as [PhotoFrame, string][]).map(([f, label]) => {
                    const on = (photo.frame ?? photoSlot.frame ?? "none") === f;
                    // Picking the layout's own frame clears the override; picking "none" over a framed layout is kept as a real choice.
                    return <button key={f} type="button" aria-pressed={on} onClick={() => setPhotoProps({ frame: f === (photoSlot.frame ?? "none") ? undefined : f })} className={chip(on)}>{label}</button>;
                  })}
                </div>
                {isAdjusted(photo) && (
                  <button type="button" onClick={() => editPage(resetPhoto(pages[at], photoSlot.id))} className="text-xs font-bold text-rose-700 underline">Reset photo</button>
                )}
              </div>
            ) : <p className="mt-1 text-xs text-stone-500">Tap a photo on the page to change how it fills its space, add a filter or give it a frame.</p>}

            <h2 className="mt-6 border-t border-stone-200 pt-4 text-sm font-bold text-stone-900">Page</h2>
            <div className="mt-2 space-y-2">
              <p className="text-xs text-stone-500">Page colour</p>
              <div role="group" aria-label="Page colour" className="flex flex-wrap items-center gap-3">
                <button type="button" aria-pressed={rawPage.bg === undefined} onClick={() => setBg(undefined)} className={chip(rawPage.bg === undefined)}>Layout&apos;s own</button>
                {bgChoices.map(([k, name]) => (
                  <button key={k} type="button" aria-pressed={rawPage.bg === k} aria-label={name} title={name} onClick={() => setBg(k)}
                    className={"h-8 w-8 rounded-full border-2 transition " + (rawPage.bg === k ? "border-rose-700 ring-2 ring-rose-300" : "border-stone-300 hover:border-stone-500")} style={{ background: book.palette[k] }} />
                ))}
              </div>
              {bgHidden(layout) && <p className="text-xs text-stone-500">A photo covers this whole page, so the colour will not show. Choose another layout to see it.</p>}
              {bgIssue && <p className="text-xs font-bold text-red-700" role="alert">On this colour, {bgIssue} is hard to read. Choose another colour, or switch back to the layout&apos;s own.</p>}
              {!bgIssue && bgChoices.length < 5 && <p className="text-xs text-stone-500">Colours that would make the text hard to read on this page are not offered.</p>}
            </div>

            <h2 className="mt-6 border-t border-stone-200 pt-4 text-sm font-bold text-stone-900">Layout</h2>
            <p className="mt-0.5 text-xs text-stone-500">Your text and photos move to the new layout where they fit. Nothing is deleted: switch back to get everything back.</p>
            {GROUP_NAMES.map(([g, label]) => (
              <div key={g} className="mt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">{label}</h3>
                <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {LAYOUT_LIST.filter((l) => l.group === g).map((l) => (
                    <li key={l.id}>
                      <button type="button" onClick={() => chooseLayout(l.id)} aria-pressed={l.id === page.layout} aria-label={`${l.name}${l.id === page.layout ? " (current)" : ""}`}
                        className={"block w-full overflow-hidden rounded-md ring-2 transition " + (l.id === page.layout ? "ring-rose-700" : "ring-stone-200 hover:ring-stone-400")}>
                        <canvas ref={(el) => { picks.current[l.id] = el; }} width={LW} height={LH} className="block aspect-[3/4] w-full" />
                      </button>
                      <span className="mt-1 block text-center text-[11px] leading-tight text-stone-600">{l.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        <details className="mt-3 rounded-lg border border-stone-200 bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-stone-800">Book style: colours and fonts</summary>
          <div className="space-y-5 border-t border-stone-200 px-4 py-4">
            <p className="text-xs text-stone-500">These change the whole book at once. Your text and photos stay as they are.</p>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Colours</h2>
              <div role="group" aria-label="Book colours" className="mt-2 flex flex-wrap gap-2">
                {PALETTE_PRESETS.map((p) => {
                  const on = p.id === paletteId;
                  return (
                    <button key={p.id} type="button" aria-pressed={on} onClick={() => onStyle({ paletteId: p.id })} className={chip(on) + " flex items-center gap-2"}>
                      <span className="flex" aria-hidden="true">
                        {([p.palette.paper, p.palette.accent, p.palette.accent2, p.palette.dark]).map((c, i) => <span key={i} className="-ml-1 h-4 w-4 rounded-full border border-black/10 first:ml-0" style={{ background: c }} />)}
                      </span>
                      {p.id === template.id ? `${p.name} (this template)` : p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Fonts</h2>
              <div role="group" aria-label="Book fonts" className="mt-2 flex flex-wrap gap-2">
                {template.fontPairs.map((fp, i) => {
                  const on = fontPair === i, name = (f: string) => /'([^']+)'/.exec(f)?.[1] ?? f;
                  return <button key={i} type="button" aria-pressed={on} onClick={() => onStyle({ fontPair: i as 0 | 1 })} className={chip(on)} style={{ fontFamily: fp.display }}>{name(fp.display)} + {name(fp.body)}</button>;
                })}
              </div>
            </div>
          </div>
        </details>
      </div>

      <div className="mx-auto mt-6 flex max-w-[360px] flex-wrap items-center justify-center gap-2" role="group" aria-label="Page actions">
        <button type="button" onClick={addNewPage} disabled={!roomForPage} className={chip(false) + " disabled:cursor-not-allowed disabled:opacity-50"}>Add page</button>
        <button type="button" onClick={copyPage} disabled={!roomForPage} className={chip(false) + " disabled:cursor-not-allowed disabled:opacity-50"}>Duplicate this page</button>
        <button type="button" onClick={() => shiftPage(-1)} disabled={!canEarlier} className={chip(false) + " disabled:cursor-not-allowed disabled:opacity-50"}>← Move earlier</button>
        <button type="button" onClick={() => shiftPage(1)} disabled={!canLater} className={chip(false) + " disabled:cursor-not-allowed disabled:opacity-50"}>Move later →</button>
        {!confirmDelete && (
          <button type="button" onClick={() => setConfirmDelete(true)} disabled={!canDelete} className={chip(false) + " disabled:cursor-not-allowed disabled:opacity-50"}>Delete this page</button>
        )}
      </div>
      {confirmDelete && canDelete && (
        <div className="mx-auto mt-3 flex max-w-[360px] flex-wrap items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2" role="group" aria-label="Confirm delete">
          <p className="text-sm font-bold text-red-800">Delete page {at + 1}? This cannot be undone.</p>
          <button type="button" onClick={removePage} className="rounded-md border border-red-700 bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-800">Delete</button>
          <button type="button" autoFocus onClick={() => setConfirmDelete(false)} className={chip(false)}>Keep</button>
        </div>
      )}
      <p className="mt-2 text-center text-xs text-stone-500" role="status">
        {roomForPage ? `${pages.length} pages. A book can have up to ${MAX_PAGES}.` : `${pages.length} pages: the most a book can have. Delete a page to add another.`}
        {deleteReason && ` ${deleteReason}`}
        {moveReason && ` ${moveReason}`}
      </p>

      <ul ref={strip} className="relative mt-4 flex gap-3 overflow-x-auto px-1 pb-3 pt-1" aria-label="Pages">
        {filled.map((p, i) => (
          <li key={i} className="shrink-0">
            <button type="button" onClick={() => goto(i)} aria-label={`Go to page ${i + 1}`} aria-current={i === at ? "page" : undefined}
              className={"block overflow-hidden rounded-md ring-2 transition " + (i === at ? "ring-rose-700" : "ring-stone-200 hover:ring-stone-400")} style={{ width: TW, height: TH }}>
              <canvas ref={(el) => { thumbs.current[i] = el; }} width={W * DPR} height={H * DPR} className="block h-full w-full" />
            </button>
            <span className="mt-1 block text-center text-xs text-stone-500">{i + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
