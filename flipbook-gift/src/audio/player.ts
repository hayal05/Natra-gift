// The shared voice-note player (task 8.2). Plain TypeScript and DOM: no React and no imports, so the recipient page, Preview and
// the offline export can all use it. It injects its own <style id="fba-style">. All text is set with textContent (the two icons are fixed constants).
// Look: a slim blue pill, bare play/pause icon on the left and a thin waveform that fills as the note plays (matches the editor pill, src/components/VoiceNotePill.tsx).
// Rules (tasks.md, Phase 8): one note per page; the button exists only while the current page has a note; a page turn stops the
// note; no autoplay; a file that cannot play shows a message, never a silent dead button.
// Usage: call `show(note)` whenever the page changes (it always stops and resets), `show(null)` when the page has no note.

export interface AudioNote { src: string; duration: number }

export interface AudioPlayerOptions {
  /** Accessible name of the button. Default "voice note". The button says "Play <label>" / "Pause <label>". */
  label?: string;
  /** No longer shown: the pill is a slim waveform with no hint text. Kept so existing callers still compile. */
  hint?: string;
  /** Called whenever the state changes. */
  onState?: (state: AudioPlayerState) => void;
  /** Colours; defaults suit a dark margin around the book. */
  theme?: { bg?: string; fg?: string; accent?: string };
}

/** Where the page sits inside its container (the engine's `onLayout` gives exactly this). */
export interface PageRect { left: number; top: number; width: number; height: number }

/** A transparent box that always covers exactly the page. Put the player inside it so the player sits ON the page, not at the screen edge. */
export interface PageLayer {
  readonly el: HTMLElement;
  setRect(r: PageRect): void;
  destroy(): void;
}

export type AudioPlayerState = "hidden" | "idle" | "loading" | "playing" | "paused" | "error";

export interface AudioPlayer {
  /** Switches to this page's note (stops and resets whatever was playing). `null` hides the player. */
  show(note: AudioNote | null): void;
  /** Pauses and rewinds to the start; the player stays visible if there is a note. */
  stop(): void;
  readonly state: AudioPlayerState;
  destroy(): void;
}

const CSS = `
.fba-root{position:absolute;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));z-index:20;pointer-events:auto;display:flex;align-items:center;gap:10px;width:84%;max-width:calc(100% - 24px);height:44px;\
  padding:0 16px 0 0;border-radius:999px;background:var(--fba-bg,#1b8fd0);color:var(--fba-fg,#fff);font:600 13px/1.3 system-ui,-apple-system,sans-serif;\
  box-shadow:0 3px 10px rgba(0,0,0,.25);-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.fba-root[hidden]{display:none}
.fba-btn{flex:none;width:44px;height:44px;min-width:44px;min-height:44px;border:0;border-radius:50%;padding:0;cursor:pointer;background:transparent;color:var(--fba-fg,#fff);
  display:flex;align-items:center;justify-content:center;touch-action:manipulation;font:inherit;font-size:20px}
.fba-btn svg{width:34px;height:34px;flex:none;display:block;overflow:visible}
.fba-btn:active{transform:scale(.92)}
.fba-btn:focus-visible{outline:3px solid var(--fba-fg,#fff);outline-offset:-3px}
.fba-btn[aria-busy="true"]{opacity:.7;cursor:progress}
.fba-wave{flex:1;min-width:0;height:100%;display:flex;align-items:center;justify-content:space-between}
.fba-wave[hidden]{display:none}
.fba-bar{flex:none;width:2.5px;border-radius:999px;background:var(--fba-fg,#fff)}
.fba-time{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.fba-err{flex:1;min-width:0;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fba-err[hidden]{display:none}
`;

// A calm, speech-like waveform: thin bars, quiet at the ends and swelling in the middle. Seeded from the note's src so each note keeps its own shape.
const BARS = 44;
const waveform = (seed: string): number[] => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967295; };
  return Array.from({ length: BARS }, (_, i) => {
    const t = i / (BARS - 1);
    const env = 0.18 + 0.82 * Math.pow(Math.sin(Math.PI * t), 1.5);
    return Math.max(0.12, Math.min(1, env * (0.35 + 0.65 * rnd())));
  });
};
// Static, hard-coded icon markup (no user text ever goes into it). The ring is a real SVG circle centred in a 34x34 box, so it is always a perfect,
// even circle, and each icon is centred on that same point (17,17) by geometry rather than by nudging.
const RING = '<circle cx="17" cy="17" r="16" fill="none" stroke="currentColor" stroke-width="2"/>';
const icon = (inner: string) => `<svg viewBox="0 0 34 34" aria-hidden="true">${RING}${inner}</svg>`;
const ICON_PLAY = icon('<path d="M14 11.5v11l9-5.5z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'); // centroid is (17,17)
const ICON_PAUSE = icon('<rect x="12" y="11.5" width="3.5" height="11" rx="1" fill="currentColor"/><rect x="18.5" y="11.5" width="3.5" height="11" rx="1" fill="currentColor"/>');
const ICON_RETRY = icon('<path d="M22.5 13.8A6.5 6.5 0 1 0 23.5 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M23 10.5v3.8h-3.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');

const fmt = (s: number): string => {
  const t = Math.max(0, Math.round(Number.isFinite(s) ? s : 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export function createAudioPlayer(container: HTMLElement, options: AudioPlayerOptions = {}): AudioPlayer {
  const doc = container.ownerDocument;
  if (!doc.getElementById("fba-style")) {
    const st = doc.createElement("style");
    st.id = "fba-style";
    st.textContent = CSS;
    doc.head.appendChild(st);
  }
  const label = options.label ?? "voice note";
  const t = options.theme ?? {};

  const root = doc.createElement("div");
  root.className = "fba-root";
  root.hidden = true;
  if (t.bg) { root.style.setProperty("--fba-bg", t.bg); root.style.setProperty("--fba-bg-solid", t.bg); }
  if (t.fg) root.style.setProperty("--fba-fg", t.fg);
  if (t.accent) root.style.setProperty("--fba-accent", t.accent);

  const btn = doc.createElement("button");
  btn.type = "button";
  btn.className = "fba-btn";
  const wave = doc.createElement("div");
  wave.className = "fba-wave";
  wave.setAttribute("aria-hidden", "true");
  const barEls: HTMLElement[] = [];
  for (let i = 0; i < BARS; i++) { const bar = doc.createElement("span"); bar.className = "fba-bar"; barEls.push(bar); wave.appendChild(bar); }
  const time = doc.createElement("span");
  time.className = "fba-time";
  const err = doc.createElement("span");
  err.className = "fba-err";
  err.setAttribute("role", "alert");
  err.hidden = true;
  root.append(btn, wave, err, time);
  container.appendChild(root);

  let audio: HTMLAudioElement | null = null;
  let note: AudioNote | null = null;
  let state: AudioPlayerState = "hidden";
  let destroyed = false;
  let shape: number[] = [];

  const total = () => (audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : note?.duration ?? 0);

  function render() {
    const playing = state === "playing" || state === "loading";
    btn.innerHTML = state === "error" ? ICON_RETRY : playing ? ICON_PAUSE : ICON_PLAY; // fixed constants only
    btn.setAttribute("aria-label", state === "error" ? `Try the ${label} again` : `${playing ? "Pause" : "Play"} ${label}`);
    btn.setAttribute("aria-busy", state === "loading" ? "true" : "false");
    const cur = audio && state !== "idle" ? audio.currentTime : 0;
    time.textContent = state === "idle" || state === "error" ? fmt(total()) : `${fmt(cur)} / ${fmt(total())}`;
    time.hidden = state === "error";
    err.hidden = state !== "error";
    wave.hidden = state === "error";
    const tot = total(), progress = tot > 0 ? Math.min(1, cur / tot) : 0;
    const started = state !== "idle" && state !== "hidden" && (progress > 0 || playing);
    barEls.forEach((bar, i) => {
      bar.style.height = `${Math.round((shape[i] ?? 0.2) * 62)}%`;
      bar.style.opacity = !started || (i + 0.5) / BARS <= progress ? "1" : "0.5"; // heard bars stay solid, the rest dim
    });
    root.hidden = state === "hidden";
  }

  function set(next: AudioPlayerState) {
    if (destroyed) return;
    const changed = next !== state;
    state = next;
    render();
    if (changed) options.onState?.(state);
  }

  function release() {
    if (!audio) return;
    audio.onplay = audio.onpause = audio.onended = audio.ontimeupdate = audio.onloadedmetadata = audio.onerror = audio.onplaying = audio.onwaiting = null;
    try { audio.pause(); } catch { /* ignore */ }
    audio.removeAttribute("src");
    try { audio.load(); } catch { /* ignore */ }
    audio = null;
  }

  function fail() {
    err.textContent = "This voice note could not be played.";
    set("error");
  }

  function attach(src: string): HTMLAudioElement {
    const a = doc.createElement("audio");
    a.preload = "metadata";
    a.onplay = () => set("loading");
    a.onplaying = () => set("playing");
    a.onwaiting = () => { if (state === "playing") set("loading"); };
    a.onpause = () => { if (!a.ended && state !== "idle" && state !== "hidden" && state !== "error") set("paused"); };
    a.onended = () => { a.currentTime = 0; set("paused"); };
    a.ontimeupdate = () => { if (state === "playing") render(); };
    a.onloadedmetadata = () => render();
    a.onerror = () => fail();
    a.src = src;
    return a;
  }

  function toggle() {
    if (!note || destroyed) return;
    if (state === "error") { release(); audio = attach(note.src); }
    if (!audio) audio = attach(note.src);
    if (state === "playing" || state === "loading") { audio.pause(); return; }
    set("loading");
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch((e: unknown) => {
        // An interrupted play (the page turned, or Pause was tapped at once) is not a broken file.
        if ((e as { name?: string })?.name === "AbortError") return;
        fail();
      });
    }
  }
  btn.addEventListener("click", toggle);

  function stop() {
    if (destroyed) return;
    if (audio) { try { audio.pause(); audio.currentTime = 0; } catch { /* ignore */ } }
    if (note) set("idle"); else set("hidden");
  }

  function show(next: AudioNote | null) {
    if (destroyed) return;
    release();
    note = next && typeof next.src === "string" && next.src ? { src: next.src, duration: next.duration } : null;
    shape = note ? waveform(note.src) : [];
    if (note) set("idle"); else set("hidden");
    render();
  }

  return {
    show,
    stop,
    get state() { return state; },
    destroy() {
      if (destroyed) return;
      release();
      destroyed = true;
      btn.removeEventListener("click", toggle);
      root.remove();
    },
  };
}

/**
 * Creates a click-through layer inside `container` that follows the page rectangle. `container` must be positioned
 * (relative or absolute) and share its top-left with the flipbook's container. Pass `layer.setRect` as the engine's `onLayout`,
 * and `layer.el` to `createAudioPlayer`.
 */
export function createPageLayer(container: HTMLElement): PageLayer {
  const el = container.ownerDocument.createElement("div");
  el.setAttribute("data-page-layer", "");
  el.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;z-index:20;pointer-events:none";
  container.appendChild(el);
  return {
    el,
    setRect(r) {
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
    },
    destroy() { el.remove(); },
  };
}
