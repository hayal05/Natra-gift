// The shared voice-note player (task 8.2). Plain TypeScript and DOM: no React and no imports, so the recipient page, Preview and
// the offline export can all use it. It injects its own <style id="fba-style">. All text is set with textContent.
// Rules (tasks.md, Phase 8): one note per page; the button exists only while the current page has a note; a page turn stops the
// note; no autoplay; a file that cannot play shows a message, never a silent dead button.
// Usage: call `show(note)` whenever the page changes (it always stops and resets), `show(null)` when the page has no note.

export interface AudioNote { src: string; duration: number }

export interface AudioPlayerOptions {
  /** Accessible name of the button. Default "voice note". The button says "Play <label>" / "Pause <label>". */
  label?: string;
  /** Shown beside the button until the note has been played once. Default "Tap to hear a voice note". */
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
.fba-root{position:absolute;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));z-index:20;pointer-events:auto;display:flex;align-items:center;gap:10px;max-width:calc(100% - 96px);
  padding:6px 14px 6px 6px;border-radius:999px;background:var(--fba-bg,rgba(0,0,0,.72));color:var(--fba-fg,#fff);font:600 13px/1.3 system-ui,-apple-system,sans-serif;
  box-shadow:0 4px 16px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.fba-root[hidden]{display:none}
.fba-btn{flex:none;width:48px;height:48px;min-width:44px;min-height:44px;border:0;border-radius:50%;padding:0;cursor:pointer;background:var(--fba-accent,#fff);color:var(--fba-bg-solid,#111);
  font:inherit;font-size:18px;display:flex;align-items:center;justify-content:center;touch-action:manipulation}
.fba-btn:active{transform:scale(.95)}
.fba-btn:focus-visible{outline:3px solid var(--fba-fg,#fff);outline-offset:2px}
.fba-btn[aria-busy="true"]{opacity:.7;cursor:progress}
.fba-text{display:flex;flex-direction:column;min-width:0}
.fba-time{font-variant-numeric:tabular-nums;white-space:nowrap}
.fba-hint{font-weight:500;opacity:.85}
.fba-hint[hidden]{display:none}
.fba-err{font-weight:700;color:#ffb4b4}
.fba-err[hidden]{display:none}
`;

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
  const text = doc.createElement("div");
  text.className = "fba-text";
  const time = doc.createElement("span");
  time.className = "fba-time";
  const hint = doc.createElement("span");
  hint.className = "fba-hint";
  hint.textContent = options.hint ?? "Tap to hear a voice note";
  const err = doc.createElement("span");
  err.className = "fba-err";
  err.setAttribute("role", "alert");
  err.hidden = true;
  text.append(time, hint, err);
  root.append(btn, text);
  container.appendChild(root);

  let audio: HTMLAudioElement | null = null;
  let note: AudioNote | null = null;
  let state: AudioPlayerState = "hidden";
  let played = false;
  let destroyed = false;

  const total = () => (audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : note?.duration ?? 0);

  function render() {
    const playing = state === "playing" || state === "loading";
    btn.textContent = state === "error" ? "↻" : playing ? "❚❚" : "▶";
    btn.setAttribute("aria-label", state === "error" ? `Try the ${label} again` : `${playing ? "Pause" : "Play"} ${label}`);
    btn.setAttribute("aria-busy", state === "loading" ? "true" : "false");
    const cur = audio && state !== "idle" ? audio.currentTime : 0;
    time.textContent = state === "idle" || state === "error" ? fmt(total()) : `${fmt(cur)} / ${fmt(total())}`;
    time.hidden = state === "error";
    hint.hidden = played || state === "error";
    err.hidden = state !== "error";
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
    a.onplaying = () => { played = true; set("playing"); };
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
    played = false;
    note = next && typeof next.src === "string" && next.src ? { src: next.src, duration: next.duration } : null;
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
