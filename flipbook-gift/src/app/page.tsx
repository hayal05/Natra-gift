"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import LiveBook from "../components/LiveBook";
import TemplateCover from "../components/TemplateCover";
import { TEMPLATE_LIST } from "../templates";

const featured = [
  { id: "birthday", label: "Birthday" },
  { id: "love-story", label: "Love" },
  { id: "appreciation", label: "Thank You" },
  { id: "wedding", label: "Congratulations" },
  { id: "just-because", label: "Just Because" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfa] text-[#1d2b3d]">
      <header className="relative z-30 mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="NatraGift home">
          <GiftIcon className="h-9 w-9 text-[#ff6b00]" />
          <span className="text-[22px] font-bold tracking-[-0.03em] text-[#1d2b3d]">
            Natra<span className="text-[#ff6b00]">Gift</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-6">
          <a
            href="#how"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-[#4f5967] transition hover:text-[#1d2b3d] sm:inline-flex"
          >
            How it works
          </a>
          <Link
            href="/create"
            className="group inline-flex items-center gap-3 rounded-full bg-[#ff6b00] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(255,107,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f45f00]"
          >
            Create a Gift
            <ArrowRight />
          </Link>
        </nav>
      </header>

      <section className="relative border-b border-[#f3eee8] bg-[radial-gradient(circle_at_72%_45%,rgba(255,196,132,0.22),transparent_31%),linear-gradient(180deg,#fffdfa_0%,#fffaf5_100%)]">
        <div className="mx-auto grid min-h-[490px] max-w-[1180px] items-center gap-8 px-5 pb-14 pt-5 sm:px-8 sm:pb-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-3 lg:pb-20 lg:pt-7">
          <div className="relative z-10 max-w-[560px]">
            <div className="mb-6 h-[3px] w-10 bg-[#ff6b00]" />
            <h1 className="font-display text-[clamp(3.2rem,6.4vw,5.2rem)] font-bold leading-[1.03] tracking-[-0.045em] text-[#1d2b3d]">
              Make someone&apos;s
              <span className="block">
                day. <span className="font-sans text-[#ff6b00]">♥</span>
              </span>
            </h1>
            <p className="mt-6 max-w-[440px] text-[18px] leading-8 text-[#68717d] sm:text-[20px]">
              Create a beautiful digital gift that opens like a letter.
            </p>
            <Link
              href="/create"
              className="group mt-7 inline-flex items-center gap-5 rounded-full bg-[#ff6b00] px-7 py-4 text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(255,107,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f45f00]"
            >
              Create a Gift
              <ArrowRight />
            </Link>
          </div>

          <div className="relative flex min-h-[360px] items-center justify-center lg:justify-end">
            <div className="absolute right-[7%] top-[12%] h-[260px] w-[260px] rounded-full bg-[#ffe6cf] blur-2xl sm:h-[340px] sm:w-[340px]" />
            <div className="absolute bottom-[4%] left-[10%] h-32 w-32 rounded-full bg-[#fff0dc] blur-xl" />
            <div className="relative w-full max-w-[520px]">
              <div className="absolute -left-2 top-10 h-20 w-16 rounded-full bg-[#fffdf8] opacity-80 blur-md sm:left-2" />
              <div className="relative ml-auto w-[86%] rotate-[4deg] rounded-[30px] border border-white/90 bg-white/65 p-3 shadow-[0_35px_70px_rgba(75,40,20,0.16)] backdrop-blur sm:p-5">
                <div className="absolute -right-3 -top-5 h-16 w-20 rounded-[12px] bg-gradient-to-br from-[#ffb16d] to-[#ff7a1c] shadow-lg" />
                <div className="absolute -right-5 top-24 h-32 w-10 rotate-[20deg] rounded-full border-l-[8px] border-[#ff7a1c] opacity-90" />
                <div className="relative z-10 rounded-[20px] bg-[#fffaf6] px-3 py-3 sm:px-5 sm:py-4">
                  <LiveBook />
                </div>
              </div>
              <div className="absolute -bottom-1 left-[7%] hidden h-24 w-24 rounded-full bg-[#fff8ef] sm:block" />
              <div className="absolute -left-1 top-[23%] hidden text-3xl text-[#ff6b00] sm:block">✦</div>
              <div className="absolute right-[1%] top-[16%] text-2xl text-[#ff6b00]">✦</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16 lg:py-16">
        <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
          <SectionHeading title="Choose a gift" />
          <div className="mt-9 grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
            {featured.map(({ id, label }) => {
              const template = TEMPLATE_LIST.find((t) => t.id === id);
              if (!template) return null;
              return (
                <Link
                  key={id}
                  href={`/create?t=${id}`}
                  className="group text-center"
                >
                  <div className="mx-auto aspect-square w-full max-w-[175px] overflow-hidden rounded-[18px] bg-[#fff5e9] shadow-sm ring-1 ring-black/[0.03] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                    <div className="h-full w-full scale-[0.82] overflow-hidden rounded-[18px] transition duration-300 group-hover:scale-[0.86]">
                      <TemplateCover template={template} />
                    </div>
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold text-[#1d2b3d]">{label}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-[#f4eee7] bg-[#fffaf5] py-14 sm:py-16 lg:py-16">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8">
          <SectionHeading title="How it works" />
          <div className="mx-auto mt-12 grid max-w-[760px] items-start gap-9 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <HowStep number="1" title="Choose" icon={<CursorIcon />} />
            <Connector />
            <HowStep number="2" title="Personalize" icon={<PenIcon />} />
            <Connector />
            <HowStep number="3" title="Send" icon={<PaperPlaneIcon />} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fff0e1]">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#ffd4aa]" />
        <div className="absolute bottom-[-90px] left-[36%] h-64 w-64 rounded-full bg-[#ffe0c1]" />
        <div className="mx-auto grid min-h-[280px] max-w-[1180px] items-center gap-8 px-5 py-12 sm:px-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-4">
              <GiftIcon className="h-10 w-10 text-[#ff6b00]" />
              <h2 className="max-w-[370px] font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-[#1d2b3d] sm:text-[32px]">
                Ready to send something special?
              </h2>
            </div>
            <Link
              href="/create"
              className="ml-14 inline-flex items-center gap-4 rounded-full bg-[#ff6b00] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(255,107,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[#f45f00]"
            >
              Create your gift
              <ArrowRight />
            </Link>
          </div>

          <div className="relative hidden h-[220px] md:block">
            <div className="absolute right-[6%] top-[26%] h-28 w-40 rotate-3 rounded-xl bg-white shadow-xl ring-1 ring-[#f5d5b7]">
              <div className="absolute inset-x-5 top-7 h-px bg-[#ffb26e]" />
              <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff6b00] text-center text-3xl leading-[42px] text-[#ff6b00]">♡</div>
            </div>
            <div className="absolute right-[22%] top-[15%] h-28 w-40 -rotate-2 rounded-xl bg-gradient-to-br from-[#ffc18a] to-[#ff8a32] shadow-lg" />
            <div className="absolute right-[36%] top-[23%] h-28 w-40 rotate-2 rounded-xl bg-white shadow-xl">
              <div className="absolute inset-x-0 top-0 h-14 rounded-t-xl bg-[#fffaf6]" />
              <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff6b00] text-center text-2xl leading-[31px] text-[#ff6b00]">♡</div>
            </div>
            <div className="absolute right-[7%] bottom-[8%] h-24 w-7 rotate-[25deg] rounded-full border-l-[8px] border-[#ff7b1e]" />
            <div className="absolute right-[45%] top-[8%] text-4xl text-[#ff6b00]">✦</div>
          </div>
        </div>
      </section>

      <footer className="bg-white px-5 py-7 text-center text-xs text-[#8a919a]">
        NatraGift · Digital gifts that open like a letter.
      </footer>
    </main>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-[30px] font-bold tracking-[-0.035em] text-[#1d2b3d] sm:text-[34px]">
        {title}
      </h2>
      <div className="mx-auto mt-4 h-[2px] w-10 bg-[#ff6b00]" />
    </div>
  );
}

function HowStep({
  number,
  title,
  icon,
}: {
  number: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative grid h-[88px] w-[88px] place-items-center rounded-full bg-[#fff3e7] text-[#ff6b00]">
        <span className="absolute -left-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-[#ff6b00] text-xs font-bold text-white shadow-sm">
          {number}
        </span>
        {icon}
      </div>
      <h3 className="mt-3 text-[17px] font-bold text-[#1d2b3d]">{title}</h3>
    </div>
  );
}

function Connector() {
  return (
    <div className="hidden items-center justify-center pt-10 text-2xl text-[#ff6b00] md:flex">→</div>
  );
}

function GiftIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M8 20h32v22H8z" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M6 20h36v-8H6zM24 20v22" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M24 12c-1.8-7-11.8-9-12.6-3.4C10.5 13.4 18.5 14 24 12Zm0 0c1.8-7 11.8-9 12.6-3.4C37.5 13.4 29.5 14 24 12Z" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M3 10h13M10.5 5.5 15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
      <path d="m13 8 23 18-10 2 5 10-5 3-6-10-7 7V8Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
      <path d="m10 35 3-9L32 7l8 8-19 19-11 1Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="m27 12 8 8M13 26l8 8" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

function PaperPlaneIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true">
      <path d="m7 23 34-14-13 31-6-13L7 23Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="m22 27 19-18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
