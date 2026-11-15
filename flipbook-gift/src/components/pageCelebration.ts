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
.fb-celebration{position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none;z-index:21;contain:layout paint}
.fb-celebration-item{position:absolute;left:var(--x);top:var(--y);opacity:0;will-change:transform,opacity;animation-duration:var(--duration);animation-delay:var(--delay);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.6,.3,1);animation-iteration-count:1}
.fb-celebration--confetti .fb-celebration-item{width:var(--size);height:calc(var(--size)*1.6);border-radius:1.5px;background:var(--color);animation-name:fb-confetti}
.fb-celebration--confetti .fb-celebration-item:nth-child(4n){border-radius:50%;height:var(--size)}
.fb-celebration--hearts .fb-celebration-item{font-size:var(--size);line-height:1;animation-name:fb-float}
.fb-celebration--sparkles .fb-celebration-item{font-size:var(--size);line-height:1;color:var(--color);text-shadow:0 0 9px var(--color);animation-name:fb-sparkle}
.fb-celebration--balloons .fb-celebration-item{width:var(--size);height:calc(var(--size)*1.28);border-radius:48% 48% 47% 47%;background:radial-gradient(circle at 31% 24%,rgba(255,255,255,.8),transparent 33%),var(--color);box-shadow:inset -5px -7px 9px rgba(0,0,0,.12);animation-name:fb-balloon}
.fb-celebration--balloons .fb-celebration-item::before{content:"";position:absolute;left:calc(50% - 4px);bottom:-5px;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:0;border-top:7px solid var(--color)}
.fb-celebration--balloons .fb-celebration-item::after{content:"";position:absolute;left:50%;top:calc(100% + 4px);height:calc(var(--size)*.9);border-left:1px solid rgba(95,68,68,.5)}
@keyframes fb-confetti{0%{opacity:0;transform:translate3d(0,-16px,0) rotate(0)}9%{opacity:1}86%{opacity:1}100%{opacity:0;transform:translate3d(var(--dx),var(--travel),0) rotate(var(--spin))}}
@keyframes fb-float{0%{opacity:0;transform:translate3d(0,25px,0) scale(.5) rotate(-15deg)}14%{opacity:1}82%{opacity:1}100%{opacity:0;transform:translate3d(var(--dx),var(--rise),0) scale(1.25) rotate(20deg)}}
@keyframes fb-balloon{0%{opacity:0;transform:translate3d(0,28px,0) scale(.65) rotate(-6deg)}12%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translate3d(var(--dx),var(--rise),0) scale(1.06) rotate(8deg)}}
@keyframes fb-sparkle{0%{opacity:0;transform:translate3d(0,10px,0) scale(.1) rotate(-35deg)}23%{opacity:1;transform:translate3d(0,0,0) scale(1.35) rotate(0)}56%{opacity:.85;transform:translate3d(var(--dx),-15px,0) scale(.7) rotate(30deg)}100%{opacity:0;transform:translate3d(var(--dx),var(--rise),0) scale(.1) rotate(85deg)}}
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
      // A finite, varied burst across the whole page. The counts are capped for mobile performance.
      const count = effect === "confetti" ? 110 : effect === "sparkles" ? 75 : effect === "hearts" ? 48 : 44;
      const colors = ["#ec4899", "#f59e0b", "#0ea5e9", "#22c55e", "#a855f7", "#ef4444", "#facc15", "#14b8a6"];
      const height = Math.max(240, root.getBoundingClientRect().height);
      const random = (i: number, salt: number) => {
        const v = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
        return v - Math.floor(v);
      };
      const fragment = doc.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const el = doc.createElement("span");
        el.className = "fb-celebration-item";
        const rand = (salt: number) => random(i, salt);
        const size = effect === "confetti" ? 5 + rand(1) * 7 :
          effect === "balloons" ? 22 + rand(1) * 24 : 15 + rand(1) * 21;
        const startY = effect === "confetti" ? -18 + rand(2) * 34 :
          effect === "balloons" ? 76 + rand(2) * 37 : 30 + rand(2) * 63;
        el.style.setProperty("--x", (2 + rand(3) * 96) + "%");
        el.style.setProperty("--y", startY + "%");
        el.style.setProperty("--size", size + "px");
        el.style.setProperty("--dx", (rand(4) * 220 - 110) + "px");
        el.style.setProperty("--travel", (height * (1.25 - startY / 100) + 40) + "px");
        el.style.setProperty("--rise", (-height * (0.7 + rand(5) * 0.95)) + "px");
        el.style.setProperty("--spin", (rand(6) * 1440 - 720) + "deg");
        el.style.setProperty("--delay", (rand(7) * 0.9) + "s");
        el.style.setProperty("--duration", (2.3 + rand(8) * 1.25) + "s");
        el.style.setProperty("--color", colors[Math.floor(rand(9) * colors.length)]);
        if (effect === "hearts") el.textContent = rand(10) > 0.5 ? "💗" : "❤️";
        else if (effect === "sparkles") el.textContent = rand(10) > 0.5 ? "✦" : "✨";
        fragment.appendChild(el);
      }
      root.appendChild(fragment);
      cleanup = doc.defaultView?.setTimeout(stop, 4800);
    },
    destroy() { destroyed = true; stop(); root.remove(); },
  };
}
