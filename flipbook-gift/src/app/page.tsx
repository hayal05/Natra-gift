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
    <main className="min-h-screen bg-[#fffaf5] text-[#202936]">
      <header className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between border-b border-[#f1e8df] px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="NatraGift home">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#ff6900] text-white shadow-[0_8px_20px_rgba(255,105,0,.18)]">
            <GiftIcon />
          </span>
          <span className="text-[22px] font-extrabold tracking-[-.04em]">
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

      <section className="relative isolate overflow-hidden border-b border-[#f1e8df] bg-[radial-gradient(circle_at_75%_40%,rgba(255,218,186,.5),transparent_36%),linear-gradient(115deg,#fffaf5,#fff6ed)]">
        <div className="mx-auto grid max-w-[1320px] items-center gap-5 px-5 py-7 sm:px-8 sm:py-10 lg:min-h-[620px] lg:grid-cols-[.82fr_1.18fr] lg:gap-10 lg:px-10 lg:py-8">
          <div className="relative z-10 order-1 max-w-[520px] lg:py-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#ff6900] sm:text-[12px]">A gift that feels personal</p>
            <h1 className="mt-3 max-w-[470px] font-serif text-[clamp(2.45rem,8vw,4.8rem)] font-bold leading-[.94] tracking-[-.055em] text-[#192a38]">Make it a moment.</h1>
            <p className="mt-4 max-w-[390px] text-[15px] leading-[1.55] text-[#727b84] sm:text-[18px]">Turn your words and memories into a beautiful little gift.</p>
            <Link href={`/create?t=${active.id}`} className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#ff6900] px-6 py-3 text-[13px] font-bold text-white shadow-[0_10px_25px_rgba(255,105,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#f25e00] sm:mt-7 sm:px-8 sm:py-3.5 sm:text-[14px]">
              Use this template <span aria-hidden="true" className="text-lg leading-none">→</span>
            </Link>
            <p className="mt-4 text-[11px] text-[#99918a]">Personalized by you · Made to be remembered</p>
          </div>

          <div className="relative order-2 mx-auto w-full max-w-[470px] lg:max-w-[560px]">
            <div className="pointer-events-none absolute -inset-4 rounded-[40%] bg-[#f7d8bb]/40 blur-3xl" />
            <div className="relative mx-auto w-[min(76%,330px)] sm:w-[min(72%,390px)] lg:w-[min(88%,450px)]">
              <div className="overflow-hidden rounded-[7px] border-[7px] border-white bg-white p-1 shadow-[0_24px_60px_rgba(75,49,29,.2)] sm:border-[9px]">
                <div className="aspect-[3/4] overflow-hidden rounded-[3px] bg-[#f7eee5]">
                  <LiveBook key={active.id} initial={active.id} />
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-4 left-1/2 h-7 w-[72%] -translate-x-1/2 rounded-full bg-[#7c563c]/20 blur-xl" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 px-2 sm:px-5 lg:mt-0 lg:absolute lg:bottom-2 lg:left-0 lg:right-0">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#ff6900]">Featured template</p>
                <p className="mt-1 truncate text-[14px] font-bold text-[#202936]">{active.name}</p>
              </div>
              <Link href={`/create?t=${active.id}`} className="shrink-0 text-[12px] font-bold text-[#ff6900] hover:text-[#df5600]">Make it yours ↗</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="flex items-end justify-between px-1 pb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#ff6900]">Templates</p>
              <h2 className="mt-1 text-[24px] font-extrabold tracking-[-.04em]">Choose your moment</h2>
            </div>
            <span className="text-[11px] font-semibold text-[#9a9ea5]">{TEMPLATE_LIST.length} designs</span>
          </div>

          <div className="pr-1">
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-7">
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
                      className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-black/[.05] p-2 shadow-[0_6px_18px_rgba(50,35,25,.05)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_25px_rgba(50,35,25,.11)] sm:rounded-[22px] sm:p-3"
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
            className="mt-7 flex h-12 items-center justify-center rounded-full bg-[#ff6900] text-[13px] font-bold text-white shadow-[0_10px_24px_rgba(255,105,0,.14)] transition hover:bg-[#f25e00] sm:mt-8"
          >
            Use “{active.name}”
          </Link>
      </section>
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
