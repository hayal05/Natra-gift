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

export default function Home() {
  const [selected, setSelected] = useState("love-story");
  const active = TEMPLATE_LIST.find((template) => template.id === selected) ?? TEMPLATE_LIST[0];

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#fffaf5] text-[#202936]">
      <header className="mx-auto flex h-[68px] max-w-[1320px] items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="NatraGift home">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#ff6900] text-white shadow-[0_8px_20px_rgba(255,105,0,.18)]">
            <GiftIcon />
          </span>
          <span className="text-[20px] font-extrabold tracking-[-.04em]">
            Natra<span className="text-[#ff6900]">Gift</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] text-[#7d838b] sm:block">Digital gifts that open like a letter.</span>
          <Link
            href={`/create?t=${active.id}`}
            className="rounded-full bg-[#ff6900] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(255,105,0,.15)] transition hover:-translate-y-0.5 hover:bg-[#f25e00]"
          >
            Create a Gift
          </Link>
        </div>
      </header>

      <div className="mx-auto grid h-[calc(100dvh-68px)] max-w-[1320px] gap-5 px-4 pb-4 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(430px,.85fr)] lg:px-8">
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-[#f0e5da] bg-white shadow-[0_18px_55px_rgba(73,47,27,.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,214,177,.42),transparent_34%),linear-gradient(145deg,#fff,#fff9f3)]" />
          <div className="relative flex items-center justify-between px-5 py-4 sm:px-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#ff6900]">Featured gift</p>
              <h1 className="mt-0.5 text-[21px] font-extrabold tracking-[-.035em] sm:text-[25px]">{active.name}</h1>
            </div>
            <span className="hidden rounded-full border border-[#eee4db] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#7d838b] sm:block">
              Live preview
            </span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden px-3 pb-4 sm:px-8">
            <div className="flex h-full items-center justify-center">
              <div className="relative max-h-full w-full max-w-[690px]">
                <div className="mx-auto w-[min(68%,560px)] min-w-[270px] max-w-full rounded-[24px] border-[7px] border-white bg-white p-1 shadow-[0_28px_65px_rgba(66,44,28,.22)] sm:w-[min(62%,600px)]">
                  <div className="aspect-[3/4] overflow-hidden rounded-[15px] bg-[#f7eee5]">
                    <LiveBook key={active.id} initial={active.id} />
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-[-8px] left-1/2 h-8 w-[55%] -translate-x-1/2 rounded-full bg-[#7c563c]/15 blur-xl" />
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between border-t border-[#f4ebe3] px-5 py-3 sm:px-7">
            <p className="max-w-[70%] truncate text-[12px] text-[#747b84]">{active.blurb}</p>
            <Link href={`/create?t=${active.id}`} className="shrink-0 rounded-full bg-[#ff6900] px-4 py-2 text-[12px] font-bold text-white transition hover:bg-[#f25e00]">
              Use this template →
            </Link>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-[28px] border border-[#f0e5da] bg-white p-4 shadow-[0_18px_55px_rgba(73,47,27,.06)] sm:p-5">
          <div className="flex items-end justify-between px-1 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#ff6900]">Templates</p>
              <h2 className="mt-1 text-[24px] font-extrabold tracking-[-.04em]">Choose your moment</h2>
            </div>
            <span className="text-[11px] font-semibold text-[#9a9ea5]">{TEMPLATE_LIST.length} designs</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {TEMPLATE_LIST.map((template) => {
                const isActive = template.id === active.id;
                const coverTitle =
                  template.id === "birthday" ? "THIS YEAR" :
                  template.id === "anniversary" ? "ALWAYS US" :
                  template.id === "wedding" ? "FOREVER" :
                  template.id === "sorry" ? "I'm Sorry" :
                  template.id === "long-distance" ? "CLOSER" :
                  template.id === "memories" ? "KEEP THIS" :
                  template.id === "appreciation" ? "THANK YOU" :
                  template.id === "best-friends" ? "US, UNFILTERED" :
                  template.id === "just-because" ? "NO REASON" : "OUR STORY";
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelected(template.id)}
                    className={`group text-left transition ${isActive ? "rounded-2xl ring-2 ring-[#ff6900] ring-offset-2 ring-offset-white" : ""}`}
                    aria-label={`Preview ${template.name}`}
                  >
                    <div
                      className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-black/[.05] p-2.5 shadow-[0_6px_18px_rgba(50,35,25,.06)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_25px_rgba(50,35,25,.11)]"
                      style={{ background: template.palette.soft }}
                    >
                      <div className="relative h-full overflow-hidden rounded-[10px] border border-black/[.06] shadow-sm" style={{ color: template.palette.ink, background: template.palette.paper }}>
                        {template.id === "memories" || template.id === "best-friends" ? (
                          <div className="absolute inset-x-2 top-2 grid h-[46%] grid-cols-3 gap-1">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="rounded-[5px] border border-black/10" style={{ background: i === 1 ? template.palette.accent2 : template.palette.soft }} />
                            ))}
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
                          <div className="text-[6px] font-bold uppercase tracking-[.16em] opacity-55">{template.masthead}</div>
                          <div className="mt-0.5 text-[13px] font-black leading-[.92] tracking-[-.04em] sm:text-[15px]">{coverTitle}</div>
                          <div className="mt-1 h-0.5 w-[54%] rounded-full" style={{ background: template.palette.accent }} />
                        </div>
                        <div className="absolute right-2 top-2 text-[9px] font-black" style={{ color: template.palette.accent }}>
                          {TEMPLATE_ICONS[template.id] ?? "✦"}
                        </div>
                      </div>
                    </div>
                    <div className="px-1 pt-2">
                      <p className="truncate text-[12px] font-bold text-[#303743]">{template.name}</p>
                    </div>
                  </button>
                );
              })}            </div>
          </div>

          <Link
            href={`/create?t=${active.id}`}
            className="mt-4 flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#ff6900] text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(255,105,0,.14)] transition hover:bg-[#f25e00]"
          >
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
