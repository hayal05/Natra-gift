"use client";

import Link from "next/link";
import { useState } from "react";
import LiveBook from "../components/LiveBook";
import TemplateScene, { type SceneConfig } from "../components/TemplateScene";
import { TEMPLATE_LIST } from "../templates";

const SERIF = "'Lora', Georgia, 'Times New Roman', serif";
const SCRIPT = "'Cormorant Garamond', Georgia, serif";

// What each template card shows: the words on the cover and the little scene under them.
const CARDS: Record<string, { title: string; script?: boolean; scene: SceneConfig }> = {
  "love-story": {
    title: "Our Story", script: true,
    scene: { kind: "land", sky: ["#fbd5c6", "#f4a98f"], sun: "#ffe6b8", layers: ["#d28b8d", "#a8657a", "#4f3f4f"] },
  },
  anniversary: {
    title: "ALWAYS US",
    scene: { kind: "land", water: true, couple: true, sky: ["#fbe6cc", "#f4b57c"], sun: "#fff0c8", layers: ["#bd8b78", "#8f6c69", "#3d4c58"] },
  },
  wedding: {
    title: "THE WEDDING",
    scene: { kind: "flowers", sky: ["#eef0e6", "#e1e7d6"] },
  },
  "best-friends": {
    title: "US, UNFILTERED",
    scene: { kind: "land", sky: ["#dcebf4", "#b9d6e8"], sun: "#fff8e0", layers: ["#93b3c9", "#6f9c8c", "#4c7c6b"] },
  },
  birthday: {
    title: "THIS YEAR",
    scene: { kind: "land", confetti: true, sky: ["#e6d9f6", "#f3b7cf"], sun: "#ffe2b5", layers: ["#a98ec8", "#7e68a1", "#40365a"] },
  },
  sorry: {
    title: "I'm Sorry",
    scene: { kind: "land", sky: ["#fdeadf", "#f7cdbf"], sun: "#fff3da", layers: ["#ebbcad", "#d49d95", "#a57072"] },
  },
  memories: {
    title: "KEEP THIS",
    scene: { kind: "land", sky: ["#fbe9cb", "#f1c18a"], sun: "#fff3cc", layers: ["#dcaa72", "#b9844f", "#6b4c35"] },
  },
  appreciation: {
    title: "THANK YOU",
    scene: { kind: "flowers", sky: ["#fde9eb", "#f8d2d9"], bloom: ["#fff5f3", "#f7b9c4"] },
  },
  "long-distance": {
    title: "CLOSER",
    scene: { kind: "land", route: true, sky: ["#d3dbf4", "#9fb0e0"], sun: "#f5f1ff", layers: ["#8a98cc", "#6b78b0", "#3b4274"] },
  },
  "just-because": {
    title: "NO REASON",
    scene: { kind: "field", sky: ["#fff2c9", "#fbd98c"], sun: "#fff6d0" },
  },
};

export default function Home() {
  const [selected, setSelected] = useState("love-story");
  const active = TEMPLATE_LIST.find((template) => template.id === selected) ?? TEMPLATE_LIST[0];
  const createHref = `/create?t=${active.id}`;

  return (
    <main className="natra-landing min-h-screen bg-[#fbf7f2] text-[#192a38]">
      <header className="mx-auto flex h-[64px] max-w-[1320px] items-center justify-between px-[6vw] sm:h-[76px] sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3" aria-label="NatraGift home">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#ff6900] text-white shadow-[0_8px_20px_rgba(255,105,0,.2)] sm:h-11 sm:w-11 sm:rounded-[14px]">
            <GiftIcon />
          </span>
          <span className="text-[24px] font-bold tracking-[-.04em] sm:text-[28px]">
            Natra<span className="text-[#ff6900]">Gift</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] text-[#7d838b] md:block">Digital gifts that open like a letter.</span>
          <Link
            href={createHref}
            className="rounded-full bg-[#ff6900] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(255,105,0,.2)] transition hover:-translate-y-0.5 hover:bg-[#f25e00] sm:px-7 sm:py-3 sm:text-[15px]"
          >
            Create a Gift
          </Link>
        </div>
      </header>

      {/* Hero: copy on the left, the live book resting on linen on the right. */}
      <section
        className="relative isolate overflow-hidden"
        style={{
          background:
            "radial-gradient(70% 60% at 85% 22%, rgba(255,255,255,.6), transparent 60%)," +
            "radial-gradient(60% 50% at 62% 95%, rgba(214,186,154,.5), transparent 65%)," +
            "linear-gradient(160deg,#f4e8d9,#ecdac4 55%,#f2e4d2)",
        }}
      >
        {/* soft cloth folds */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-[10%] top-[8%] -z-10 h-[40%] w-[80%] -rotate-[18deg] rounded-full bg-white/40 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-[12%] left-[20%] -z-10 h-[34%] w-[90%] -rotate-[12deg] rounded-full bg-[#d8bf9f]/30 blur-2xl" />
        {/* fade into the page colour behind the copy */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-[55%] bg-gradient-to-r from-[#fbf7f2] via-[#fbf7f2]/70 to-transparent" />

        <Leaves />
        <Petals />

        <div className="relative mx-auto flex min-h-[92vw] max-w-[1320px] items-center sm:min-h-[480px] lg:min-h-[640px]">
          <div className="relative z-10 w-[46%] py-8 pl-[5vw] sm:w-[44%] sm:pl-8 lg:pl-10">
            <p className="text-[2.6vw] font-semibold uppercase tracking-[.2em] text-[#ff6900] sm:text-[12px] lg:text-[13px]">A gift that feels personal</p>
            <h1
              className="mt-[3vw] text-[8vw] font-bold leading-[.98] tracking-[-.045em] text-[#192a38] sm:mt-4 sm:text-[clamp(2.8rem,6vw,4.2rem)] lg:text-[clamp(3.4rem,5.2vw,4.9rem)]"
              style={{ fontFamily: SERIF }}
            >
              Make it a moment.
            </h1>
            <p className="mt-[3vw] max-w-[420px] text-[3.4vw] leading-[1.5] text-[#77706a] sm:mt-5 sm:text-[17px] lg:text-[19px]">
              Turn your words and memories into a beautiful little gift.
            </p>
            <Link
              href={createHref}
              className="mt-[4vw] inline-flex items-center gap-[1.4vw] whitespace-nowrap rounded-full bg-[#ff6900] px-[3.2vw] py-[2.6vw] text-[2.9vw] font-semibold text-white shadow-[0_10px_25px_rgba(255,105,0,.22)] transition hover:-translate-y-0.5 hover:bg-[#f25e00] sm:mt-7 sm:gap-3 sm:px-8 sm:py-3.5 sm:text-[15px]"
            >
              Use this template <span aria-hidden="true" className="text-[1.2em] leading-none">→</span>
            </Link>
          </div>

          <div className="relative z-10 min-w-0 flex-1 py-8 pr-[4vw] sm:pr-8 lg:pr-12">
            <div className="mx-auto w-full max-w-[420px] lg:max-w-[440px]">
              <LiveBook key={active.id} initial={active.id} />
            </div>
          </div>
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-[1320px] px-[6vw] pb-12 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pt-14">
        <div className="flex items-end justify-between gap-3 pb-5">
          <div>
            <p className="text-[2.6vw] font-semibold uppercase tracking-[.2em] text-[#ff6900] sm:text-[12px]">Find your feeling</p>
            <h2 className="mt-1.5 text-[6.2vw] font-bold leading-tight tracking-[-.03em] sm:text-[30px] lg:text-[36px]" style={{ fontFamily: SERIF }}>
              Choose your moment
            </h2>
          </div>
          <span className="shrink-0 pb-1 text-[3vw] font-semibold text-[#8b8f96] sm:text-[14px]">{TEMPLATE_LIST.length} templates</span>
        </div>

        <div className="grid grid-cols-3 gap-x-[3vw] gap-y-[5vw] sm:gap-x-5 sm:gap-y-8 lg:grid-cols-5">
          {TEMPLATE_LIST.map((template) => {
            const card = CARDS[template.id];
            const isActive = template.id === active.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelected(template.id)}
                aria-label={`Preview ${template.name}`}
                aria-pressed={isActive}
                className={`group flex flex-col items-stretch justify-start self-start text-left ${isActive ? "rounded-[20px] ring-2 ring-[#ff6900] ring-offset-[3px] ring-offset-[#fbf7f2]" : ""}`}
              >
                <div
                  className="rounded-[18px] p-[1.6vw] shadow-[0_6px_18px_rgba(50,35,25,.05)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_26px_rgba(50,35,25,.12)] sm:p-3"
                  style={{ background: template.palette.soft }}
                >
                  <div
                    className="relative aspect-[10/9] overflow-hidden rounded-[11px] border border-white/60 sm:rounded-[14px]"
                    style={{ background: `linear-gradient(180deg, ${card.scene.sky[0]}, ${card.scene.sky[1]})`, color: template.palette.ink }}
                  >
                    <TemplateScene id={template.id} {...card.scene} className="absolute inset-x-0 bottom-0 h-[64%] w-full" />
                    <div className="absolute inset-x-1 top-[9%] text-center">
                      {card.script ? (
                        <p className="text-[5.8vw] italic leading-[.86] sm:text-[30px]" style={{ fontFamily: SCRIPT, color: template.palette.accent }}>
                          {card.title}
                        </p>
                      ) : (
                        <p className="mx-auto max-w-[90%] text-[2.7vw] leading-[1.25] tracking-[.12em] sm:text-[13px]" style={{ fontFamily: SERIF }}>
                          {card.title}
                        </p>
                      )}
                      <div className="mt-[1.4vw] flex items-center justify-center gap-1 sm:mt-2" style={{ color: template.palette.accent }}>
                        <span className="h-px w-[16%] bg-current opacity-50" />
                        <HeartIcon />
                        <span className="h-px w-[16%] bg-current opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="px-1 pt-2 text-[3.2vw] font-semibold text-[#192a38] sm:text-[14px]">{template.name}</p>
              </button>
            );
          })}
        </div>

        <Link
          href={createHref}
          className="mx-auto mt-9 flex h-12 items-center justify-center rounded-full bg-[#ff6900] text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(255,105,0,.2)] transition hover:bg-[#f25e00] sm:mt-12 sm:h-14 sm:max-w-sm sm:text-[15px]"
        >
          Use “{active.name}”
        </Link>
      </section>
    </main>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" aria-hidden="true">
      <path d="M4 10h16v10H4zM3 10h18V7H3zM12 7v13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 7C11 2.7 5.8 2.4 5.8 5.3 5.8 7.3 9.3 7.4 12 7Zm0 0c1-4.3 6.2-4.6 6.2-1.7 0 2-3.5 2.1-6.2 1.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[3vw] w-[3vw] sm:h-3.5 sm:w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.3 3 4.8 6.6 4.8c2.2 0 3.7 1.2 5.4 3.2 1.7-2 3.2-3.2 5.4-3.2 3.6 0 5.7 3.5 4.2 7C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

// Olive branch in the hero's top-right corner.
function Leaves() {
  const leaves: Array<[number, number, number, string]> = [
    [150, 44, 25, "#6f7c45"], [118, 56, -40, "#869455"], [92, 84, 20, "#6f7c45"], [64, 100, -35, "#869455"], [40, 128, 15, "#6f7c45"],
    [128, 86, 62, "#869455"], [100, 114, 70, "#6f7c45"],
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 200 160" className="pointer-events-none absolute right-0 top-0 z-0 w-[38vw] max-w-[320px]" style={{ opacity: 0.95 }}>
      <path d="M200 6 C150 20 100 50 30 150" fill="none" stroke="#5d6a39" strokeWidth="1.8" strokeLinecap="round" />
      {leaves.map(([x, y, rot, fill], i) => (
        <ellipse key={i} cx={x} cy={y} rx="9" ry="22" fill={fill} transform={`rotate(${rot + 40} ${x} ${y})`} />
      ))}
    </svg>
  );
}

// A few fallen petals on the cloth.
function Petals() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 100" className="pointer-events-none absolute bottom-[4%] left-[26%] z-0 w-[22vw] max-w-[180px] sm:left-[34%]">
      <ellipse cx="22" cy="30" rx="9" ry="16" fill="#f6d9c4" transform="rotate(-28 22 30)" />
      <ellipse cx="14" cy="76" rx="9" ry="15" fill="#f3cfb6" transform="rotate(20 14 76)" />
      <ellipse cx="62" cy="86" rx="8" ry="13" fill="#f6d9c4" transform="rotate(-55 62 86)" />
    </svg>
  );
}
