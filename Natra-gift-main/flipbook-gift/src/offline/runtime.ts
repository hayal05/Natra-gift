// The script inside the offline file (task 6.1). Bundled by scripts/build-offline.mjs into public/offline/runtime.js.
// Same flow as the recipient page (GiftView): envelope, then a full-screen book with Close and Full screen, and a closed screen.
import { create, type Flipbook } from "../engine";
import { createAudioPlayer, type AudioPlayer } from "../audio";
import { createEnvelope, type Envelope } from "../envelope";
import { loadFonts, loadImages, pageDrawFn } from "../lib/pages";
import { enterFullscreen, fsElement, fsSupported, leaveFullscreen, onFullscreenChange } from "../lib/fullscreen";
import { LAYOUTS } from "../templates/layouts";
import type { OfflineGift } from "./types";

const app = document.getElementById("app") as HTMLElement;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string, parent?: HTMLElement) {
  const e = document.createElement(tag); e.className = cls; if (text !== undefined) e.textContent = text; parent?.appendChild(e); return e;
}
const message = (title: string, body: string) => {
  const box = el("div", "fbo-screen", undefined, app); box.setAttribute("role", "alert");
  el("h1", "fbo-title", title, box); el("p", "fbo-text", body, box);
};

async function main() {
  let g: OfflineGift;
  try { g = JSON.parse(document.getElementById("gift")!.textContent || ""); }
  catch { message("This gift could not be opened", "The file looks damaged. Ask the sender for a new copy."); return; }

  await loadFonts(g.style.fonts);
  const root = el("div", "fbo-root", undefined, app);
  const stage = el("div", "fbo-stage", undefined, root);
  const drawFns = loadImages(g.pages).then((images) => g.pages.map((p) => pageDrawFn(p, LAYOUTS, g.style, images)));

  let book: Flipbook | undefined, player: AudioPlayer | undefined, envelope: Envelope | undefined;
  let bar: HTMLElement | undefined, closed: HTMLElement | undefined;
  let fsBtn: HTMLButtonElement | undefined;
  const syncFs = () => { if (fsBtn) { const on = !!fsElement(); fsBtn.textContent = on ? "Exit full screen" : "Full screen"; fsBtn.setAttribute("aria-label", fsBtn.textContent); fsBtn.setAttribute("aria-pressed", String(on)); } };
  onFullscreenChange(syncFs);

  const start = () => {
    if (book) return;
    closed?.remove(); closed = undefined;
    book = create(stage, {
      pages: g.pages.map((_, i) => drawFns.then((fns) => fns[i])),
      onPageChange: (i) => player?.show(g.pages[i]?.audio ?? null),
      fit: "contain", loadingText: "Opening your gift…", errorText: "This gift could not be drawn.", retryText: "Try again", onRetry: () => location.reload(),
    });
    player = createAudioPlayer(app); player.show(g.pages[0]?.audio ?? null); // voice notes: only on the page that owns one, no autoplay
    bar = el("div", "fbo-bar", undefined, app);
    if (fsSupported()) {
      fsBtn = el("button", "fbo-btn", undefined, bar); fsBtn.type = "button"; syncFs();
      fsBtn.addEventListener("click", () => { if (fsElement()) void leaveFullscreen(); else void enterFullscreen(app); });
    }
    const x = el("button", "fbo-btn fbo-x", "✕", bar); x.type = "button"; x.setAttribute("aria-label", "Close the book");
    x.addEventListener("click", stop);
  };
  const stop = () => {
    void leaveFullscreen();
    player?.destroy(); player = undefined; book?.destroy(); book = undefined; bar?.remove(); bar = undefined; fsBtn = undefined;
    closed = el("div", "fbo-screen", undefined, app);
    el("p", "fbo-text", "Your gift is closed. Open it again whenever you like.", closed);
    const again = el("button", "fbo-again", "Open the book again", closed); again.type = "button"; again.autofocus = true;
    again.addEventListener("click", () => { start(); void enterFullscreen(app); });
    again.focus();
  };

  envelope = createEnvelope(root, {
    to: g.to, from: g.from, message: g.message,
    theme: { ...g.style.palette, display: g.style.fonts.display, body: g.style.fonts.body },
    onOpen: () => { start(); void enterFullscreen(app); window.setTimeout(() => { envelope?.destroy(); envelope = undefined; }, 700); },
  });
}

main().catch(() => message("This gift could not be opened", "Something went wrong. Try opening the file again."));
