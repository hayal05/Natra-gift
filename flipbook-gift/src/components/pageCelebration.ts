// Lightweight one-shot celebrations aligned to the visible page. Shared by preview, published and offline readers.
import type { PageRect } from "../engine/types";
import type { Celebration } from "../lib/pages/types";

export const CELEBRATIONS: { id: Celebration; label: string }[] = [
  { id: "confetti", label: "🎊 Confetti" },
  { id: "hearts", label: "💗 Hearts" },
  { id: "sparkles", label: "✨ Sparkles" },
  { id: "balloons", label: "🎈 Balloons" },
];

const STYLE_ID = "fb-celebration-style";
const STYLES = `
.fb-celebration{position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;z-index:21}
.fb-celebration-item{position:absolute;left:var(--x);top:var(--y);opacity:0;will-change:transform,opacity;animation-duration:var(--duration);animation-delay:var(--delay);animation-fill-mode:both;animation-timing-function:ease-out;animation-iteration-count:1}
.fb-celebration--confetti .fb-celebration-item{width:8px;height:14px;border-radius:2px;background:var(--color);animation-name:fb-confetti}
.fb-celebration--hearts .fb-celebration-item{font-size:clamp(14px,5vw,24px);animation-name:fb-float}
.fb-celebration--sparkles .fb-celebration-item{font-size:clamp(16px,5vw,26px);animation-name:fb-sparkle}
.fb-celebration--balloons .fb-celebration-item{font-size:clamp(20px,7vw,36px);animation-name:fb-float}
@keyframes fb-confetti{0%{opacity:0;transform:translate3d(0,-22px,0) rotate(0)}12%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translate3d(var(--dx),110vh,0) rotate(var(--spin))}}
@keyframes fb-float{0%{opacity:0;transform:translate3d(0,22px,0) scale(.65)}15%{opacity:1}75%{opacity:1}100%{opacity:0;transform:translate3d(var(--dx),var(--rise),0) scale(1.15)}}
@keyframes fb-sparkle{0%{opacity:0;transform:scale(.2) rotate(-45deg)}35%{opacity:1;transform:scale(1.2) rotate(10deg)}100%{opacity:0;transform:scale(.3) rotate(60deg)}}
@media (prefers-reduced-motion:reduce){.fb-celebration-item{animation:none!important;display:none}}
`;

export interface CelebrationLayer {
  setRect(rect: PageRect): void;
  show(effect: Celebration | null | undefined): void;
  destroy(): void;
}

export function createCelebrationLayer(container: HTMLElement): CelebrationLayer {
  const doc = container.ownerDocument;
  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLES;
    doc.head.appendChild(style);
  }
  const root = doc.createElement("div");
  root.className = "fb-celebration";
  root.setAttribute("aria-hidden", "true");
  container.appendChild(root);
  let cleanup: number | undefined;
  let destroyed = false;
  const stop = () => {
    if (cleanup !== undefined) { clearTimeout(cleanup); cleanup = undefined; }
    root.replaceChildren();
    root.className = "fb-celebration";
  };
  return {
    setRect(r) {
      root.style.left = r.left + "px";
      root.style.top = r.top + "px";
      root.style.width = r.width + "px";
      root.style.height = r.height + "px";
    },
    show(effect) {
      if (destroyed) return;
      stop(); // A page turn stops the prior celebration; nothing loops.
      if (!effect || !CELEBRATIONS.some((item) => item.id === effect) ||
          doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
      root.classList.add("fb-celebration--" + effect);
      const count = effect === "confetti" ? 34 : effect === "sparkles" ? 18 : 14;
      const colors = ["#ec4899", "#f59e0b", "#0ea5e9", "#22c55e", "#a855f7"];
      for (let i = 0; i < count; i++) {
        const el = doc.createElement("span");
        el.className = "fb-celebration-item";
        const rand = (n: number) => ((i * 47 + n * 31 + i * i * 13) % 101) / 101;
        el.style.setProperty("--x", (5 + rand(1) * 90) + "%");
        el.style.setProperty("--y", (effect === "confetti" ? -10 + rand(2) * 30 : 38 + rand(2) * 58) + "%");
        el.style.setProperty("--dx", (rand(3) * 100 - 50) + "px");
        el.style.setProperty("--rise", (-120 - rand(4) * 240) + "px");
        el.style.setProperty("--spin", (rand(5) * 1000 - 500) + "deg");
        el.style.setProperty("--delay", (rand(6) * 0.35) + "s");
        el.style.setProperty("--duration", (1.5 + rand(7) * 0.65) + "s");
        if (effect === "confetti") el.style.setProperty("--color", colors[i % colors.length]);
        else el.textContent = effect === "hearts" ? "💗" : effect === "balloons" ? "🎈" : "✨";
        root.appendChild(el);
      }
      cleanup = doc.defaultView?.setTimeout(stop, 2600);
    },
    destroy() { destroyed = true; stop(); root.remove(); },
  };
}
