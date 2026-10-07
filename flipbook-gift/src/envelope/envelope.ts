// The surprise envelope (task 5.1). Plain TypeScript and DOM: no React and no imports, so the offline export (6.1) inlines it as is.
// Flow: closed envelope with "Open Your Gift" -> the flap opens and the letter rises -> the letter shows who it is for, the message and who it is from
// -> a second button ("See your gift") fires onOpen, and the page puts the book behind the fading envelope screen (5.3).
// All text is set with textContent (never as HTML), so names and messages cannot inject markup.

export interface EnvelopeTheme {
  paper: string; ink: string; accent: string; accent2: string; soft: string; dark: string;
  /** CSS font-family strings; the page must have loaded the fonts already. */
  display: string; body: string;
}

export interface EnvelopeOptions {
  to: string;
  from: string;
  message: string;
  theme: EnvelopeTheme;
  heading?: string;
  openText?: string;
  continueText?: string;
  /** Called when the person taps "See your gift". The envelope screen then fades out; call `destroy()` when you no longer need it. */
  onOpen?: () => void;
}

export interface Envelope {
  /** Starts the opening animation (what the first button does). Returns false if it was already started. */
  open(): boolean;
  readonly state: "closed" | "opening" | "reading" | "done";
  destroy(): void;
}

const CSS = `
.fbe-root{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(18px,4vh,36px);padding:20px;box-sizing:border-box;overflow:hidden;
  background:radial-gradient(120% 90% at 50% 20%,var(--fbe-glow),var(--fbe-dark) 70%);color:var(--fbe-paper);font-family:var(--fbe-body);text-align:center;
  opacity:1;transition:opacity .6s ease;-webkit-tap-highlight-color:transparent}
.fbe-root.fbe-leaving{opacity:0;pointer-events:none}
.fbe-heading{margin:0;max-width:20em;font-family:var(--fbe-display);font-weight:400;font-size:clamp(22px,6vw,32px);line-height:1.25;text-wrap:balance;transition:opacity .5s ease,transform .7s ease}
.fbe-stage{position:relative;width:var(--fbe-wc);height:calc(var(--fbe-wc)*.98);flex:none;max-height:56vh}
.fbe-env{position:absolute;left:50%;top:50%;width:var(--fbe-we);height:calc(var(--fbe-we)*.68);margin-left:calc(var(--fbe-we)/-2);margin-top:calc(var(--fbe-we)*-.34);perspective:900px;filter:drop-shadow(0 18px 24px rgba(0,0,0,.35))}
.fbe-back{position:absolute;inset:0;border-radius:6px;background:var(--fbe-soft);z-index:1}
.fbe-front{position:absolute;inset:0;border-radius:6px;z-index:4;background:linear-gradient(180deg,rgba(255,255,255,.35),rgba(0,0,0,.04)),var(--fbe-soft);
  clip-path:polygon(0 0,50% 52%,100% 0,100% 100%,0 100%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}
.fbe-front::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.07),transparent 40%,transparent 60%,rgba(0,0,0,.07));clip-path:inherit}
.fbe-flap{position:absolute;left:0;right:0;top:0;height:56%;z-index:5;transform-origin:50% 0;transition:transform .8s cubic-bezier(.4,.1,.2,1);
  background:linear-gradient(180deg,rgba(255,255,255,.4),rgba(0,0,0,.08)),var(--fbe-soft);clip-path:polygon(0 0,100% 0,50% 100%);backface-visibility:visible}
.fbe-seal{position:absolute;left:50%;top:calc(var(--fbe-we)*.68*.5);width:calc(var(--fbe-we)*.17);height:calc(var(--fbe-we)*.17);margin:calc(var(--fbe-we)*-.085) 0 0 calc(var(--fbe-we)*-.085);z-index:6;border-radius:50%;
  background:var(--fbe-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:calc(var(--fbe-we)*.08);box-shadow:0 2px 6px rgba(0,0,0,.35);transition:opacity .35s ease}
.fbe-letter{position:absolute;left:50%;top:50%;width:var(--fbe-wc);height:calc(var(--fbe-wc)*.9);margin:calc(var(--fbe-wc)*-.45) 0 0 calc(var(--fbe-wc)/-2);z-index:3;box-sizing:border-box;border-radius:8px;
  background:var(--fbe-paper);color:var(--fbe-ink);padding:clamp(18px,5vw,30px);display:flex;flex-direction:column;justify-content:center;gap:10px;overflow:auto;opacity:0;
  transform:scale(var(--fbe-s));box-shadow:0 10px 30px rgba(0,0,0,.3);transition:transform .9s cubic-bezier(.3,.1,.2,1),opacity .3s ease}
.fbe-for{margin:0;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:var(--fbe-accent);font-weight:700}
.fbe-to{margin:0;font-family:var(--fbe-display);font-weight:400;font-size:clamp(28px,8vw,40px);line-height:1.1;overflow-wrap:anywhere}
.fbe-msg{margin:0;font-size:clamp(15px,4.2vw,18px);line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.fbe-from{margin:4px 0 0;font-family:var(--fbe-display);font-style:italic;font-size:clamp(18px,5vw,22px);color:var(--fbe-accent);overflow-wrap:anywhere}
.fbe-btn{font:inherit;font-weight:700;font-size:17px;border:0;border-radius:999px;padding:14px 30px;min-height:48px;cursor:pointer;background:var(--fbe-accent);color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.3);transition:opacity .4s ease,transform .2s ease}
.fbe-btn:active{transform:scale(.97)}
.fbe-btn:focus-visible{outline:3px solid var(--fbe-paper);outline-offset:3px}
.fbe-btn[hidden]{display:none}
.fbe-slot{display:flex;align-items:center;justify-content:center;min-height:48px;flex:none}
.fbe-opening .fbe-flap{transform:rotateX(180deg);z-index:2;transition:transform .8s cubic-bezier(.4,.1,.2,1),z-index 0s .35s}
.fbe-opening .fbe-seal{opacity:0}
.fbe-opening .fbe-heading{opacity:0}
.fbe-opening .fbe-letter,.fbe-reading .fbe-letter{opacity:1}
.fbe-rise .fbe-letter{transform:translateY(calc(var(--fbe-we)*-.34)) scale(var(--fbe-s))}
.fbe-reading .fbe-letter{transform:none;z-index:6}
.fbe-back,.fbe-front,.fbe-flap{transition:opacity .7s ease}
.fbe-reading .fbe-back,.fbe-reading .fbe-front,.fbe-reading .fbe-flap{opacity:0}
.fbe-reading .fbe-heading{opacity:0}
.fbe-instant,.fbe-instant *{transition-duration:.01s!important;transition-delay:0s!important}
`;

const STYLE_ID = "fbe-style";

export function createEnvelope(container: HTMLElement, opts: EnvelopeOptions): Envelope {
  const doc = container.ownerDocument;
  if (!doc.getElementById(STYLE_ID)) { const s = doc.createElement("style"); s.id = STYLE_ID; s.textContent = CSS; doc.head.appendChild(s); }
  const t = opts.theme;
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string, parent?: HTMLElement) => {
    const e = doc.createElement(tag); e.className = cls; if (text !== undefined) e.textContent = text; parent?.appendChild(e); return e;
  };

  const root = el("div", "fbe-root");
  root.setAttribute("role", "region"); root.setAttribute("aria-label", "A gift for " + opts.to);
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set("--fbe-paper", t.paper); set("--fbe-ink", t.ink); set("--fbe-accent", t.accent); set("--fbe-soft", t.soft); set("--fbe-dark", t.dark);
  set("--fbe-glow", `color-mix(in srgb, ${t.accent} 35%, ${t.dark})`); // colour-mix is widely supported; older browsers keep a plain dark background below
  set("--fbe-display", t.display); set("--fbe-body", t.body);
  set("--fbe-wc", "min(86vw, 360px, 62vh)"); set("--fbe-we", "min(74vw, 300px, 52vh)"); set("--fbe-s", "calc(var(--fbe-we) * .6 / var(--fbe-wc))");
  if (!root.style.getPropertyValue("--fbe-glow")) root.style.background = t.dark;

  const heading = el("h1", "fbe-heading", opts.heading ?? "Someone has a special surprise for you.");
  const stage = el("div", "fbe-stage", undefined, root);
  const env = el("div", "fbe-env", undefined, stage);
  el("div", "fbe-back", undefined, env);
  const letter = el("div", "fbe-letter");
  el("p", "fbe-for", "For", letter); el("p", "fbe-to", opts.to, letter);
  if (opts.message.trim()) el("p", "fbe-msg", opts.message, letter);
  el("p", "fbe-from", "With love, " + opts.from, letter);
  env.appendChild(letter); // between the back (z 1) and the front (z 4) of the envelope while small, then above everything (z 6) when it is read
  el("div", "fbe-front", undefined, env);
  el("div", "fbe-flap", undefined, env);
  el("div", "fbe-seal", "♥", env).setAttribute("aria-hidden", "true");
  root.insertBefore(heading, stage);
  const slot = el("div", "fbe-slot", undefined, root);
  const openBtn = el("button", "fbe-btn", opts.openText ?? "Open Your Gift ❤️", slot); openBtn.type = "button";
  const goBtn = el("button", "fbe-btn", opts.continueText ?? "See your gift", slot); goBtn.type = "button"; goBtn.hidden = true;

  container.appendChild(root);
  const reduce = !!doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) root.classList.add("fbe-instant");

  let state: Envelope["state"] = "closed";
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, reduce ? 20 : ms)); };

  const open = () => {
    if (state !== "closed") return false;
    state = "opening";
    openBtn.hidden = true;
    root.classList.add("fbe-opening");
    later(() => root.classList.add("fbe-rise"), 750);
    later(() => {
      state = "reading"; root.classList.remove("fbe-rise"); root.classList.add("fbe-reading");
      later(() => { goBtn.hidden = false; goBtn.focus({ preventScroll: true }); }, 900);
    }, 1700);
    return true;
  };
  openBtn.addEventListener("click", open);
  goBtn.addEventListener("click", () => {
    if (state !== "reading") return;
    state = "done"; goBtn.disabled = true; root.classList.add("fbe-leaving");
    opts.onOpen?.();
  });
  openBtn.focus({ preventScroll: true });

  return {
    open,
    get state() { return state; },
    destroy() { timers.forEach(clearTimeout); root.remove(); },
  };
}
