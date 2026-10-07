// Small DOM overlay for the engine: discreet prev/next buttons plus loading and error states.
// Plain DOM and inline styles so the engine stays framework-free and exportable as one file.

export type EngineState = "loading" | "ready" | "error";

export interface UiHandlers {
  prev(): void;
  next(): void;
  /** If provided, the error state shows a retry button that calls this. */
  retry?: () => void;
}

export interface UiOptions {
  buttons: boolean;
  loadingText: string;
  errorText: string;
  retryText: string;
}

export interface Ui {
  setState(state: EngineState): void;
  /** Show or hide the arrows (they are always hidden unless the state is "ready"). */
  setNav(canPrev: boolean, canNext: boolean): void;
  /** Keep the arrows next to the page edges: `inset` is the page's horizontal offset inside the root. */
  setInset(inset: number): void;
  destroy(): void;
}

const CSS = `
@keyframes fb-spin{to{transform:rotate(360deg)}}
.fb-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:34px;height:34px;border:0;border-radius:50%;
background:rgba(0,0,0,.28);color:#fff;font:600 22px/1 system-ui,sans-serif;display:none;place-items:center;padding:0 0 3px;
cursor:pointer;opacity:.6;transition:opacity .2s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.fb-btn:hover,.fb-btn:focus-visible{opacity:1}
.fb-ov{position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;
text-align:center;padding:16px;font:500 14px/1.4 system-ui,sans-serif;color:inherit}
.fb-spin{width:26px;height:26px;border-radius:50%;border:3px solid currentColor;border-top-color:transparent;opacity:.55;animation:fb-spin .9s linear infinite}
.fb-retry{border:1px solid currentColor;background:transparent;color:inherit;border-radius:99px;padding:8px 16px;font:600 13px system-ui,sans-serif;cursor:pointer}
`;

export function createUi(root: HTMLElement, handlers: UiHandlers, opts: UiOptions): Ui {
  const style = document.createElement("style");
  style.textContent = CSS;
  root.appendChild(style);

  const mkBtn = (cls: string, side: "left" | "right", label: string, glyph: string, onClick: () => void) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.style[side] = "6px";
    b.setAttribute("aria-label", label);
    b.textContent = glyph;
    b.addEventListener("click", onClick);
    if (opts.buttons) root.appendChild(b);
    return b;
  };
  const prevBtn = mkBtn("fb-btn", "left", "Previous page", "‹", () => handlers.prev());
  const nextBtn = mkBtn("fb-btn", "right", "Next page", "›", () => handlers.next());

  const overlay = document.createElement("div");
  overlay.className = "fb-ov";
  root.appendChild(overlay);

  let state: EngineState = "loading";
  let canPrev = false;
  let canNext = false;

  function renderButtons() {
    const show = state === "ready";
    prevBtn.style.display = show && canPrev ? "grid" : "none";
    nextBtn.style.display = show && canNext ? "grid" : "none";
  }

  function setState(next: EngineState) {
    state = next;
    overlay.replaceChildren();
    overlay.removeAttribute("role");
    if (next === "ready") {
      overlay.style.display = "none";
    } else if (next === "loading") {
      overlay.style.display = "flex";
      overlay.setAttribute("role", "status");
      const spin = document.createElement("div");
      spin.className = "fb-spin";
      const text = document.createElement("div");
      text.textContent = opts.loadingText;
      overlay.append(spin, text);
    } else {
      overlay.style.display = "flex";
      overlay.setAttribute("role", "alert");
      const text = document.createElement("div");
      text.textContent = opts.errorText;
      overlay.append(text);
      if (handlers.retry) {
        const r = document.createElement("button");
        r.type = "button";
        r.className = "fb-retry";
        r.textContent = opts.retryText;
        r.addEventListener("click", () => handlers.retry?.());
        overlay.append(r);
      }
    }
    renderButtons();
  }

  setState("loading");

  return {
    setState,
    setNav(p, n) {
      canPrev = p;
      canNext = n;
      renderButtons();
    },
    setInset(inset) {
      prevBtn.style.left = inset + 6 + "px";
      nextBtn.style.right = inset + 6 + "px";
    },
    destroy() {
      style.remove();
      prevBtn.remove();
      nextBtn.remove();
      overlay.remove();
    },
  };
}
