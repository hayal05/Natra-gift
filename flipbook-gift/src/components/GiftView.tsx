"use client";
// Recipient experience (task 5.2): fetch the gift, wait for its fonts, show the envelope while the photos load behind it,
// then start the book when the envelope opens. Task 5.3: the opened book is a full-screen reading mode: a fixed full-viewport layout
// (the only mode on iPhone Safari) plus the Fullscreen API where the browser has it, and a close button.
import { useCallback, useEffect, useRef, useState } from "react";
import { create, type Flipbook } from "../engine";
import { createEnvelope, type Envelope } from "../envelope";
import { loadFonts, loadImages, pageDrawFn } from "../lib/pages";
import { draftPalette, type Draft } from "../lib/draft";
import { enterFullscreen, fsElement, fsSupported, leaveFullscreen, onFullscreenChange } from "../lib/fullscreen";
import { LAYOUTS, TEMPLATES, bookStyle, fill, fillPages } from "../templates";

type Phase = "loading" | "notfound" | "error" | "ready";
/** envelope = not opened yet; reading = the book; closed = the reader pressed Close (a calm screen with a way back). */
type Mode = "envelope" | "reading" | "closed";

/** The server checks every gift before storing it; this only guards against a malformed answer. */
function usable(d: unknown): d is Draft {
  const x = d as Draft | null;
  return !!x && typeof x === "object" && !!TEMPLATES[x.templateId] && Array.isArray(x.pages) && x.pages.length > 0
    && typeof x.to === "string" && typeof x.from === "string";
}

export default function GiftView({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<Mode>("envelope");
  const [fs, setFs] = useState(false);
  const [canFs, setCanFs] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [draftForAudio, setDraftForAudio] = useState<Draft | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLElement>(null);
  const reader = useRef<{ start: () => void; stop: () => void } | null>(null);
  const retry = useCallback(() => { setPhase("loading"); setAttempt((n) => n + 1); }, []);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    let envelope: Envelope | undefined;
    let book: Flipbook | undefined;
    const ctl = new AbortController();
    setMode("envelope");
    setDraftForAudio(null);
    setCurrentPage(0);

    (async () => {
      let draft: Draft;
      try {
        const res = await fetch(`/api/gifts/${encodeURIComponent(token)}`, { cache: "no-store", signal: ctl.signal });
        if (cancelled) return;
        if (res.status === 404) { setPhase("notfound"); return; }
        if (!res.ok) { setPhase("error"); return; }
        const data: unknown = await res.json();
        if (!usable(data)) { setPhase("error"); return; }
        draft = data;
        setDraftForAudio(draft);
      } catch { if (!cancelled) setPhase("error"); return; }

      const template = TEMPLATES[draft.templateId];
      const style = bookStyle(template, draft.fontPair, draftPalette(draft));
      const names = { to: draft.to.trim() || "you", from: draft.from.trim() || "me" };
      const pages = fillPages(draft.pages, names);
      setCurrentPage(0);
      const message = draft.invitation ?? fill(template.invitation, names);

      await loadFonts(style.fonts); // the envelope and the pages must not draw in a fallback face
      if (cancelled || !host.current) return;
      setPhase("ready");

      // The photos load while the envelope plays. A photo that fails draws a placeholder instead of stopping the book.
      const drawFns = loadImages(pages).then((images) => pages.map((p) => pageDrawFn(p, LAYOUTS, style, images)));
      const root = host.current;
      // Created when the book is shown (not behind the envelope) so the arrow keys cannot turn pages under it; destroyed on Close.
      reader.current = {
        start: () => {
          const stage = root.querySelector<HTMLElement>("[data-book]");
          if (!stage || book) return;
          book = create(stage, {
            pages: pages.map((_, i) => drawFns.then((fns) => fns[i])),
            fit: "contain",
            loadingText: "Opening your gift…",
            errorText: "This gift could not be drawn.",
            retryText: "Try again",
            onRetry: () => window.location.reload(),
            onPageChange: (i) => setCurrentPage(i),
          });
          setMode("reading");
        },
        stop: () => { book?.destroy(); book = undefined; setMode("closed"); },
      };
      envelope = createEnvelope(root, {
        to: names.to, from: names.from, message,
        theme: { ...style.palette, display: style.fonts.display, body: style.fonts.body },
        onOpen: () => {
          // Runs inside the tap on "See your gift", which the browser requires before it allows fullscreen.
          reader.current!.start();
          if (shell.current) void enterFullscreen(shell.current);
          timers.push(window.setTimeout(() => { envelope?.destroy(); envelope = undefined; }, 700)); // after its 0.6 s fade
        },
      });
    })();

    return () => { reader.current = null; cancelled = true; ctl.abort(); timers.forEach(clearTimeout); envelope?.destroy(); book?.destroy(); };
  }, [token, attempt]);

  useEffect(() => {
    setCanFs(fsSupported());
    const sync = () => setFs(!!fsElement());
    const off = onFullscreenChange(sync);
    return () => { off(); void leaveFullscreen(); };
  }, []);

  const currentAudio = draftForAudio?.pages[currentPage]?.audio;

  useEffect(() => {
    const audio = audioRef.current;
    setAudioPlaying(false);
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }, [currentAudio?.src]);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio || !currentAudio) return;
    if (audio.paused) void audio.play().then(() => setAudioPlaying(true)).catch(() => setAudioPlaying(false));
    else { audio.pause(); setAudioPlaying(false); }
  };

  const close = () => { audioRef.current?.pause(); setAudioPlaying(false); void leaveFullscreen(); reader.current?.stop(); };
  const reopen = () => { reader.current?.start(); if (shell.current) void enterFullscreen(shell.current); };
  const toggleFs = () => { if (fsElement()) void leaveFullscreen(); else if (shell.current) void enterFullscreen(shell.current); };

  const message = phase === "notfound"
    ? { title: "We could not find this gift", body: "The link may be incomplete or mistyped. Please check it with the person who sent it." }
    : phase === "error"
      ? { title: "The gift did not load", body: "Please check your connection and try again." }
      : null;

  return (
    <main ref={shell} className="fixed inset-0 overflow-hidden overscroll-none bg-stone-900 text-stone-100" style={{ height: "100dvh" }}>
      {/* The envelope is mounted inside this relative, full-viewport box and covers the book until it opens. */}
      <div ref={host} className="relative h-full w-full">
        <div data-book className="absolute inset-0" />
      </div>
      {mode === "reading" && currentAudio && (
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2" style={{ bottom: "max(1rem, env(safe-area-inset-bottom))", left: "max(1rem, env(safe-area-inset-left))" }}>
          <audio ref={audioRef} key={currentAudio.src} preload="metadata" src={currentAudio.src}
            onPlay={() => setAudioPlaying(true)} onPause={() => setAudioPlaying(false)} onEnded={() => setAudioPlaying(false)} className="hidden" />
          <button type="button" onClick={toggleAudio} aria-label={audioPlaying ? "Pause audio note" : "Play audio note"} aria-pressed={audioPlaying}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-stone-900 shadow-xl ring-2 ring-white/80 active:scale-95">
            <span aria-hidden="true">{audioPlaying ? "❚❚" : "▶"}</span>
          </button>
          <div className="rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">Audio note · page {currentPage + 1}</div>
        </div>
      )}
            {mode === "reading" && (
        <div className="absolute right-3 z-10 flex gap-2" style={{ top: "max(0.75rem, env(safe-area-inset-top))", right: "max(0.75rem, env(safe-area-inset-right))" }}>
          {canFs && (
            <button type="button" onClick={toggleFs} aria-label={fs ? "Exit full screen" : "Full screen"} aria-pressed={fs}
              className="flex h-11 min-w-11 items-center justify-center rounded-full bg-black/45 px-3 text-sm font-semibold text-white backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              {fs ? "Exit full screen" : "Full screen"}
            </button>
          )}
          <button type="button" onClick={close} aria-label="Close the book"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-xl text-white backdrop-blur focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}
      {mode === "closed" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-stone-900 px-6 text-center">
          <p className="max-w-sm text-lg text-stone-200">Your gift is closed. Open it again whenever you like.</p>
          <button type="button" onClick={reopen} autoFocus className="min-h-12 rounded-full bg-stone-100 px-6 font-semibold text-stone-900">Open the book again</button>
        </div>
      )}
      {phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900" role="status">
          <p className="animate-pulse text-lg text-stone-300">Unwrapping your gift…</p>
        </div>
      )}
      {message && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-stone-900 px-6 text-center" role="alert">
          <h1 className="font-display text-2xl">{message.title}</h1>
          <p className="max-w-sm text-stone-300">{message.body}</p>
          {phase === "error" && (
            <button type="button" onClick={retry} className="min-h-12 rounded-full bg-stone-100 px-6 font-semibold text-stone-900">Try again</button>
          )}
        </div>
      )}
    </main>
  );
}
