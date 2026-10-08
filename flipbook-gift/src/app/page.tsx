"use client";

import Link from "next/link";
import { useState } from "react";
import LiveBook from "../components/LiveBook";
import { TEMPLATE_LIST } from "../templates";

const TEMPLATE_ICONS: Record<string, string> = {
  "love-story": "♥",
  anniversary: "∞",
  wedding: "⌁",
  "best-friends": "★",
  birthday: "✦",
  sorry: "…",
  memories: "▧",
  appreciation: "♡",
  "long-distance": "☾",
  "just-because": "✿",
};

const COVER_TITLES: Record<string, string> = {
  birthday: "THIS YEAR",
  anniversary: "ALWAYS US",
  wedding: "FOREVER",
  sorry: "I’M SORRY",
  "long-distance": "CLOSER",
  memories: "KEEP THIS",
  appreciation: "THANK YOU",
  "best-friends": "US, UNFILTERED",
  "just-because": "NO REASON",
  "love-story": "OUR STORY",
};

export default function Home() {
  const [selected, setSelected] = useState("sorry");
  const active = TEMPLATE_LIST.find((template) => template.id === selected) ?? TEMPLATE_LIST[0];

  return (
    <main className="min-h-screen bg-[#fffaf5] text-[#202936]">
      <header className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-5 sm:px-7">
        <Link href="/" className="flex items-center gap-3" aria-label="NatraGift home">
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#ff6900] text-white shadow-[0_8px_20px_rgba(255,105,0,.18)]">
            <GiftIcon />
          </span>
          <span className="text-[22px] font-extrabold tracking-[-.045em]">
            Natra<span className="text-[#ff6900]">Gift</span>
          </span>
        </Link>
        <Link href={`/create?t=${active.id}`} className="rounded-full bg-[#ff6900] px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(255,105,0,.15)] transition hover:bg-[#f25e00] sm:px-7 sm:text-[14px]">
          Create a Gift
        </Link>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-5 px-4 pb-7 sm:px-7 lg:grid-cols-[.95fr_1.05fr] lg:items-start lg:gap-6 lg:pb-10">
        <section className="overflow-hidden rounded-[30px] border border-[#eee2d6] bg-white/80 shadow-[0_14px_45px_rgba(88,60,35,.055)]">
          <div className="px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#f36b13]">Featured gift</p>
            <h1 className="mt-1 text-[27px] font-extrabold tracking-[-.055em] sm:text-[31px]">{active.name}</h1>
          </div>

          <div className="relative flex justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_55%,rgba(255,222,196,.62),transparent_65%)] px-5 pb-4 pt-2 sm:px-7">
            <div className="relative w-[min(68%,285px)] sm:w-[min(64%,320px)] lg:w-[min(78%,330px)]">
              <div className="rounded-[29px] border-[7px] border-white bg-white p-1.5 shadow-[0_18px_45px_rgba(71,49,32,.15)] sm:border-[8px]">
                <div className="aspect-[3/4] overflow-hidden rounded-[19px] bg-[#f7eee5]">
                  <LiveBook key={active.id} initial={active.id} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-[#f2e9e0] bg-[#fffdfa] px-5 py-4 sm:px-7">
            <p className="min-w-0 flex-1 truncate text-[13px] text-[#81858c] sm:text-[14px]">{active.description ?? "A thoughtful little gift, made personal by you."}</p>
            <Link href={`/create?t=${active.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ff6900] px-4 py-3 text-[12px] font-bold text-white transition hover:bg-[#f25e00] sm:px-5 sm:text-[13px]">
              Use template <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-[30px] border border-[#eee2d6] bg-white/85 p-4 shadow-[0_14px_45px_rgba(88,60,35,.045)] sm:p-6">
          <div className="flex items-end justify-between gap-3 px-1 pb-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#f36b13]">Templates</p>
              <h2 className="mt-1 text-[26px] font-extrabold tracking-[-.055em] sm:text-[30px]">Choose your moment</h2>
            </div>
            <span className="pb-1 text-[11px] font-semibold text-[#9a9ea5]">{TEMPLATE_LIST.length} designs</span>
          </div>

          <div className="max-h-[330px] overflow-y-auto pr-1 [scrollbar-width:thin] lg:max-h-[560px]">
            <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5">
              {TEMPLATE_LIST.map((template) => {
                const isActive = template.id === active.id;
                const coverTitle = COVER_TITLES[template.id] ?? "OUR STORY";
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelected(template.id)}
                    className={`group min-w-0 text-left transition ${isActive ? "rounded-[22px] ring-2 ring-[#ff6900] ring-offset-2 ring-offset-white" : ""}`}
                    aria-label={`Preview ${template.name}`}
                    aria-pressed={isActive}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-black/[.05] p-2 shadow-[0_6px_18px_rgba(50,35,25,.05)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_25px_rgba(50,35,25,.11)] sm:rounded-[20px] sm:p-2.5" style={{ background: template.palette.soft }}>
                      <div className="relative h-full overflow-hidden rounded-[10px] border border-black/[.06] shadow-sm" style={{ color: template.palette.ink, background: template.palette.paper }}>
                        {template.id === "memories" || template.id === "best-friends" ? (
                          <div className="absolute inset-x-2 top-2 grid h-[46%] grid-cols-3 gap-1">
                            {[0, 1, 2].map((n) => <div key={n} className="rounded-[5px] border border-black/10" style={{ background: n === 1 ? template.palette.accent2 : template.palette.soft }} />)}
                          </div>
                        ) : template.id === "long-distance" ? (
                          <div className="absolute inset-x-3 top-5 h-[32%]">
                            <div className="absolute left-0 top-1/2 h-px w-full border-t border-dashed" style={{ borderColor: template.palette.accent }} />
                            <span className="absolute left-0 top-[calc(50%-4px)] h-2 w-2 rounded-full" style={{ background: template.palette.accent }} />
                            <span className="absolute right-0 top-[calc(50%-4px)] h-2 w-2 rounded-full" style={{ background: template.palette.accent }} />
                          </div>
                        ) : template.id === "sorry" ? (
                          <div className="absolute inset-x-4 top-4 h-[38%] rounded-md border" style={{ borderColor: template.palette.accent2 }}>
                            <div className="mx-auto mt-4 h-1 w-1/2 rounded-full" style={{ background: template.palette.accent }} />
                            <div className="mx-auto mt-2 h-1 w-1/3 rounded-full bg-black/10" />
                          </div>
                        ) : (
                          <div className="absolute inset-x-2 top-2 h-[46%] overflow-hidden rounded-[6px]" style={{ background: "linear-gradient(135deg, " + template.palette.accent + ", " + template.palette.accent2 + ")" }}>
                            <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-white/15" />
                            <div className="absolute -bottom-7 -left-3 h-16 w-16 rounded-full bg-black/10" />
                          </div>
                        )}
                        <div className="absolute inset-x-2 bottom-2">
                          <div className="truncate text-[6px] font-bold uppercase tracking-[.13em] opacity-55">{template.masthead}</div>
                          <div className="mt-0.5 break-words text-[clamp(9px,2.7vw,15px)] font-black leading-[.92] tracking-[-.04em]">{coverTitle}</div>
                          <div className="mt-1 h-0.5 w-[54%] rounded-full" style={{ background: template.palette.accent }} />
                        </div>
                        <div className="absolute right-2 top-2 text-[9px] font-black" style={{ color: template.palette.accent }}>{TEMPLATE_ICONS[template.id] ?? "✦"}</div>
                      </div>
                    </div>
                    <div className="px-1 pt-2">
                      <p className="truncate text-[12px] font-bold text-[#303743] sm:text-[13px]">{template.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Link href={`/create?t=${active.id}`} className="mt-4 flex h-[50px] shrink-0 items-center justify-center rounded-full bg-[#ff6900] text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(255,105,0,.14)] transition hover:bg-[#f25e00] sm:mt-5">
            Use “{active.name}”
          </Link>
        </section>
      </div>
    </main>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 10h16v10H4zM3 10h18V7H3zM12 7v13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M12 7C11 2.7 5.8 2.4 5.8 5.3 5.8 7.3 9.3 7.4 12 7Zm0 0c1-4.3 6.2-4.6 6.2-1.7 0 2-3.5 2.1-6.2 1.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}
