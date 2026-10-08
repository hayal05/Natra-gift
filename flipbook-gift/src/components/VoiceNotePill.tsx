"use client";
// Shows the page's voice note ON the page while editing, the same pill the recipient and Preview see (src/audio/player.ts),
// so the creator can tell at a glance which pages have a note and can play it without opening the Audio tab.
// One <audio> per mounted pill: the editor keys it by page + source, so changing page or replacing the note stops playback.
import { useEffect, useMemo, useRef, useState } from "react";

/** Where the pill sits inside the page box, as 0..1 of the free space (0 = left/top edge, 1 = right/bottom edge). Never pixels, so it survives resizes. */
export type PillPos = { x: number; y: number };
export const DEFAULT_PILL_POS: PillPos = { x: 0.5, y: 1 }; // bottom centre, where the pill used to be fixed
const EDGE = 12; // px kept between the pill and the page edge
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// A calm, speech-like waveform: thin bars that swell toward the middle with a few peaks. Seeded from the note's src so each note keeps its own shape.
const BARS = 44;
const waveform = (seed: string): number[] => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967295; };
  return Array.from({ length: BARS }, (_, i) => {
    const t = i / (BARS - 1);
    const env = 0.18 + 0.82 * Math.sin(Math.PI * t) ** 1.5; // quiet at the ends, loud in the middle
    return Math.max(0.12, Math.min(1, env * (0.35 + 0.65 * rnd())));
  });
};

const fmt = (s: number): string => {
  const t = Math.max(0, Math.round(Number.isFinite(s) ? s : 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export default function VoiceNotePill({ src, duration, onOpen, pos = DEFAULT_PILL_POS, onMove }: { src: string; duration: number; onOpen?: () => void; pos?: PillPos; onMove?: (p: PillPos) => void }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ id: number; px: number; py: number; left: number; top: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [time, setTime] = useState(0);
  const [total, setTotal] = useState(duration);

  useEffect(() => () => { audio.current?.pause(); audio.current = null; }, []); // leaving the page or removing the note stops it

  const toggle = () => {
    if (state === "playing" || state === "loading") { audio.current?.pause(); return; }
    let a = audio.current;
    if (!a || state === "error") {
      a = new Audio();
      a.preload = "metadata";
      a.src = src;
      a.onplaying = () => setState("playing");
      a.onwaiting = () => setState("loading");
      a.onpause = () => setState((s) => (s === "error" ? s : "paused"));
      a.onended = () => { setState("idle"); setTime(0); };
      a.ontimeupdate = () => setTime(a!.currentTime);
      a.onloadedmetadata = () => { if (Number.isFinite(a!.duration) && a!.duration > 0) setTotal(a!.duration); };
      a.onerror = () => setState("error");
      audio.current = a;
    }
    setState("loading");
    a.play().catch(() => setState("error"));
  };

  const playing = state === "playing" || state === "loading";
  // The page below handles taps to select and drag boxes; the pill must not trigger that.
  const stop = (e: React.PointerEvent) => e.stopPropagation();

  // Drag from anywhere on the pill. A press that never travels 6px stays a tap, so play / pause / edit still work.
  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = box.current, parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return;
    const r = el.getBoundingClientRect(), pr = parent.getBoundingClientRect();
    drag.current = { id: e.pointerId, px: e.clientX, py: e.clientY, left: r.left - pr.left, top: r.top - pr.top, moved: false };
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current, el = box.current, parent = el?.offsetParent as HTMLElement | null;
    if (!d || d.id !== e.pointerId || !el || !parent) return;
    e.stopPropagation();
    const dx = e.clientX - d.px, dy = e.clientY - d.py;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      d.moved = true;
      setDragging(true);
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    const freeW = parent.clientWidth - el.offsetWidth - EDGE * 2, freeH = parent.clientHeight - el.offsetHeight - EDGE * 2;
    const x = freeW > 0 ? clamp01((d.left + dx - EDGE) / freeW) : 0.5;
    const y = freeH > 0 ? clamp01((d.top + dy - EDGE) / freeH) : 0.5;
    onMove?.({ x, y });
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    setDragging(false);
    if (d.moved) { justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 0); } // swallow the click that follows a drag
    try { box.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const cancel = () => { drag.current = null; setDragging(false); };

  const x = clamp01(pos.x), y = clamp01(pos.y);
  const bars = useMemo(() => waveform(src), [src]);
  const progress = total > 0 ? Math.min(1, time / total) : 0;
  const label = state === "error" ? "Can't play this note" : state === "idle" ? `Voice note, ${fmt(total)}` : `Voice note, ${fmt(time)} of ${fmt(total)}`;
  return (
    <div
      ref={box}
      role="group"
      aria-label="Voice note on this page. Drag to move it."
      title={label}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onClickCapture={(e) => { if (justDragged.current) { e.stopPropagation(); e.preventDefault(); } }}
      style={{
        left: `calc(${EDGE}px + ${x} * (100% - ${EDGE * 2}px))`,
        top: `calc(${EDGE}px + ${y} * (100% - ${EDGE * 2}px))`,
        transform: `translate(${-x * 100}%, ${-y * 100}%)`,
        touchAction: "none",
      }}
      className={"absolute z-10 flex h-11 w-[84%] select-none items-center gap-3 rounded-full bg-[#1b8fd0] pl-0 pr-4 text-white shadow-md " + (dragging ? "cursor-grabbing ring-2 ring-white/70" : "cursor-grab")}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={state === "error" ? "Try the voice note again" : playing ? "Pause voice note" : "Play voice note"}
        className="grid h-11 w-11 shrink-0 place-items-center text-white active:scale-90"
      >
        <svg viewBox="0 0 34 34" className="block h-[34px] w-[34px] shrink-0 overflow-visible" aria-hidden>
          <circle cx="17" cy="17" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
          {state === "error" ? (
            <>
              <path d="M22.5 13.8A6.5 6.5 0 1 0 23.5 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M23 10.5v3.8h-3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : playing ? (
            <>
              <rect x="12" y="11.5" width="3.5" height="11" rx="1" fill="currentColor" />
              <rect x="18.5" y="11.5" width="3.5" height="11" rx="1" fill="currentColor" />
            </>
          ) : (
            <path d="M14 11.5v11l9-5.5z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          )}
        </svg>
      </button>
      <div className="flex h-full min-w-0 flex-1 items-center justify-between" aria-hidden>
        {bars.map((v, i) => (
          <span
            key={i}
            className="w-[2.5px] shrink-0 rounded-full bg-white"
            style={{ height: `${Math.round(v * 62)}%`, opacity: state === "error" ? 0.35 : (i + 0.5) / BARS <= progress ? 1 : playing || progress > 0 ? 0.5 : 1 }}
          />
        ))}
      </div>
      {onOpen && (
        <button type="button" onClick={onOpen} aria-label="Open voice note settings" className="grid h-6 w-6 shrink-0 place-items-center text-xs text-white/80 hover:text-white">✎</button>
      )}
    </div>
  );
}
