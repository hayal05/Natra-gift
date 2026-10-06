"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import LiveBook from "../components/LiveBook";
import { TEMPLATE_LIST } from "../templates";

const featured = [
  { id: "birthday", label: "Birthday", kind: "birthday" },
  { id: "love-story", label: "Love", kind: "love" },
  { id: "appreciation", label: "Thank You", kind: "thanks" },
  { id: "wedding", label: "Congratulations", kind: "graduation" },
  { id: "just-because", label: "Just Because", kind: "because" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdfa] text-[#1d2b3d]">
      <header className="relative z-40 mx-auto flex h-[82px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="NatraGift home">
          <GiftIcon className="h-9 w-9 text-[#ff6900]" />
          <span className="font-display text-[22px] font-bold tracking-[-0.035em] text-[#1e2b3d]">
            Natra<span className="text-[#ff6900]">Gift</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-5">
          <a href="#how" className="hidden px-4 py-2 text-[14px] font-medium text-[#4e5662] transition hover:text-[#ff6900] sm:inline-flex">
            How it works
          </a>
          <Link href="/create" className="inline-flex items-center gap-3 rounded-full bg-[#ff6900] px-5 py-3 text-[13px] font-bold text-white shadow-[0_9px_22px_rgba(255,105,0,.16)] transition hover:-translate-y-0.5 hover:bg-[#f25e00]">
            Create a Gift <ArrowRight />
          </Link>
        </nav>
      </header>

      <section className="relative bg-[radial-gradient(circle_at_73%_45%,rgba(255,190,121,.25),transparent_29%),linear-gradient(180deg,#fffdfa_0%,#fff9f3_100%)]">
        <div className="absolute left-0 right-0 top-0 h-px bg-white" />
        <div className="mx-auto grid min-h-[490px] max-w-[1180px] items-center gap-6 px-5 pb-16 pt-5 sm:px-8 lg:grid-cols-[.94fr_1.06fr] lg:gap-0 lg:pb-20 lg:pt-7">
          <div className="relative z-20 max-w-[530px]">
            <div className="mb-6 h-[3px] w-10 bg-[#ff6900]" />
            <h1 className="font-display text-[clamp(3.15rem,6vw,5.1rem)] font-bold leading-[1.04] tracking-[-0.052em] text-[#1d2b3d]">
              Make someone&apos;s
              <span className="block">day. <span className="font-sans text-[#ff6900]">♥</span></span>
            </h1>
            <p className="mt-5 max-w-[450px] text-[18px] leading-[1.65] text-[#69717b] sm:text-[20px]">
              Create a beautiful digital gift<br className="hidden sm:block" /> that opens like a letter.
            </p>
            <Link href="/create" className="mt-7 inline-flex items-center gap-5 rounded-full bg-[#ff6900] px-7 py-[17px] text-[15px] font-bold text-white shadow-[0_14px_30px_rgba(255,105,0,.18)] transition hover:-translate-y-0.5 hover:bg-[#f25e00]">
              Create a Gift <ArrowRight />
            </Link>
          </div>

          <div className="relative flex min-h-[390px] items-center justify-center lg:justify-end">
            <GiftScene />
          </div>
        </div>
      </section>

      <section className="bg-white py-[52px] sm:py-[62px]">
        <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
          <SectionHeading title="Choose a gift" />
          <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
            {featured.map(({ id, label, kind }) => {
              const template = TEMPLATE_LIST.find((t) => t.id === id);
              if (!template) return null;
              return (
                <Link key={id} href={`/create?t=${id}`} className="group text-center">
                  <div className="mx-auto aspect-square w-full max-w-[176px] overflow-hidden rounded-[18px] bg-[#fff4e8] shadow-[0_4px_15px_rgba(33,42,53,.035)] ring-1 ring-black/[.025] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(45,35,25,.10)]">
                    <PackageIllustration kind={kind} />
                  </div>
                  <h3 className="mt-[14px] text-[16px] font-bold text-[#1d2b3d]">{label}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-[#f5eee7] bg-[#fffaf5] py-[51px] sm:py-[62px]">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8">
          <SectionHeading title="How it works" />
          <div className="mx-auto mt-11 grid max-w-[760px] items-start gap-7 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <HowStep number="1" title="Choose" icon={<CursorIcon />} />
            <Connector />
            <HowStep number="2" title="Personalize" icon={<PenIcon />} />
            <Connector />
            <HowStep number="3" title="Send" icon={<PaperPlaneIcon />} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fff0e1]">
        <div className="absolute -right-20 -top-24 h-[300px] w-[300px] rounded-full bg-[#ffd8b5]" />
        <div className="absolute bottom-[-125px] left-[35%] h-[290px] w-[290px] rounded-full bg-[#ffe1c8]" />
        <div className="absolute left-[48%] top-[-120px] h-[260px] w-[260px] rounded-full bg-[#fff6ec]" />
        <div className="relative mx-auto grid min-h-[285px] max-w-[1180px] items-center gap-7 px-5 py-12 sm:px-8 md:grid-cols-[.82fr_1.18fr]">
          <div className="relative z-10">
            <div className="mb-4 flex items-start gap-4">
              <GiftIcon className="mt-1 h-10 w-10 shrink-0 text-[#ff6900]" />
              <h2 className="max-w-[390px] font-display text-[28px] font-bold leading-[1.18] tracking-[-.035em] text-[#1d2b3d] sm:text-[32px]">
                Ready to send<br className="hidden sm:block" /> something special?
              </h2>
            </div>
            <Link href="/create" className="ml-14 inline-flex items-center gap-4 rounded-full bg-[#ff6900] px-6 py-[14px] text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(255,105,0,.16)] transition hover:-translate-y-0.5 hover:bg-[#f25e00]">
              Create your gift <ArrowRight />
            </Link>
          </div>
          <div className="relative hidden h-[225px] md:block">
            <GiftBundle />
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
      <h2 className="font-display text-[30px] font-bold tracking-[-.04em] text-[#1d2b3d] sm:text-[34px]">{title}</h2>
      <div className="mx-auto mt-4 h-[2px] w-10 bg-[#ff6900]" />
    </div>
  );
}

function HowStep({ number, title, icon }: { number: string; title: string; icon: ReactNode }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative grid h-[88px] w-[88px] place-items-center rounded-full bg-[#fff2e6] text-[#ff6900]">
        <span className="absolute -left-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-[#ff6900] text-xs font-bold text-white shadow-sm">{number}</span>
        {icon}
      </div>
      <h3 className="mt-3 text-[17px] font-bold text-[#1d2b3d]">{title}</h3>
    </div>
  );
}

function Connector() {
  return <div className="hidden items-center justify-center pt-10 text-[25px] font-light text-[#ff6900] md:flex">→</div>;
}

function GiftScene() {
  return (
    <div className="relative h-[390px] w-full max-w-[570px]">
      <div className="absolute right-[5%] top-[8%] h-[300px] w-[300px] rounded-full bg-[#ffe7d1] blur-2xl sm:h-[350px] sm:w-[350px]" />
      <div className="absolute bottom-[3%] left-[8%] h-[120px] w-[150px] rounded-full bg-[#fff1df] blur-xl" />

      <div className="absolute bottom-[19%] left-[3%] z-10 hidden sm:block">
        <FlowerSprig />
      </div>

      <div className="absolute right-[3%] top-[12%] h-[215px] w-[185px] rotate-[10deg] rounded-[10px] bg-gradient-to-br from-[#ffb777] via-[#ff9950] to-[#ff7b22] shadow-[0_22px_35px_rgba(183,92,30,.18)]">
        <div className="absolute inset-x-0 top-0 h-[66px] -skew-y-[8deg] rounded-t-[10px] bg-[#ffad6a]" />
        <div className="absolute -bottom-1 right-[-17px] h-[145px] w-[22px] rotate-[17deg] rounded-full border-l-[8px] border-[#ff7a1d]" />
      </div>

      <div className="absolute bottom-[8%] right-[14%] z-20 h-[365px] w-[280px] rotate-[6deg] rounded-[22px] border-[7px] border-white bg-[#fffaf6] p-[10px] shadow-[0_28px_55px_rgba(72,46,28,.19)] sm:h-[375px] sm:w-[295px]">
        <div className="h-full overflow-hidden rounded-[13px] bg-white">
          <div className="h-[57%] bg-gradient-to-b from-[#fff6ef] via-[#fff0e7] to-[#f4c9a8]">
            <div className="pt-9 text-center">
              <div className="font-serif text-[23px] italic leading-tight text-[#5a2b1d]">Happy</div>
              <div className="font-serif text-[24px] italic leading-tight text-[#5a2b1d]">Birthday</div>
              <div className="mt-1 text-[13px] text-[#ff6900]">♥</div>
            </div>
            <div className="relative mt-4 h-[116px]">
              <div className="absolute bottom-0 left-[8%] h-[72px] w-[84%] rounded-t-[45%] bg-[#f8dfc9]" />
              <MiniBouquet />
            </div>
          </div>
          <div className="flex h-[43%] items-center justify-center bg-[#fffdf9]">
            <div className="text-center font-serif text-[9px] italic leading-4 text-[#805746]">May your dreams be bigger<br />than your worries.</div>
          </div>
        </div>
        <div className="absolute bottom-[-2px] left-[18px] right-[18px] flex items-center justify-between text-[#ff6900]">
          <span className="text-[15px]">←</span>
          <span className="h-[2px] w-[112px] bg-[#eadfd5]"><span className="block -mt-[3px] ml-[39%] h-2 w-2 rounded-full bg-[#ff6900]" /></span>
          <span className="text-[15px]">→</span>
        </div>
      </div>

      <div className="absolute left-[10%] top-[11%] z-30 text-[29px] text-[#ff6900]">✦</div>
      <div className="absolute left-[4%] top-[21%] z-30 text-[24px] text-[#ff6900]">✦</div>
      <div className="absolute left-[12%] top-[2%] z-30 h-7 w-[2px] rotate-[-38deg] bg-[#ff6900]" />
      <div className="absolute left-[19%] top-[1%] z-30 h-7 w-[2px] rotate-[-6deg] bg-[#ff6900]" />
    </div>
  );
}

function PackageIllustration({ kind }: { kind: string }) {
  return (
    <div className="relative h-full w-full">
      {kind === "birthday" && <BirthdayPackage />}
      {kind === "love" && <LovePackage />}
      {kind === "thanks" && <ThanksPackage />}
      {kind === "graduation" && <GraduationPackage />}
      {kind === "because" && <BecausePackage />}
    </div>
  );
}

function BirthdayPackage() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="giftbox" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffdf9"/><stop offset="1" stopColor="#f4eee8"/></linearGradient>
        <linearGradient id="orangebox" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff9b4b"/><stop offset="1" stopColor="#f46c12"/></linearGradient>
      </defs>
      <g transform="translate(33 45)">
        <path d="M17 49h104v73H17z" fill="url(#giftbox)" stroke="#e8d9cb" strokeWidth="2"/>
        <path d="M10 39h118v22H10z" fill="url(#orangebox)" rx="4"/>
        <path d="M65 39v83" stroke="#ff7b1e" strokeWidth="9"/>
        <path d="M52 39c-8-18-25-22-30-13-4 8 11 17 30 13Zm26 0c8-18 25-22 30-13 4 8-11 17-30 13Z" fill="#ff8a2d"/>
        <path d="M10 39h118" stroke="#fff7ef" strokeWidth="2" opacity=".8"/>
        <path d="M28 76h82" stroke="#eee3da" strokeWidth="2"/>
        <path d="M29 84h67" stroke="#f1e7de" strokeWidth="2"/>
      </g>
      <g fill="#ff6900">
        <path d="M38 29l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>
        <path d="M147 34l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>
        <path d="M157 105l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>
      </g>
    </svg>
  );
}

function LovePackage() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <defs><radialGradient id="heart" cx=".35" cy=".25"><stop stopColor="#ff8c78"/><stop offset="1" stopColor="#e94539"/></radialGradient></defs>
      <path d="M100 156C90 146 40 116 40 73c0-25 34-36 50-10 16-26 50-15 50 10 0 43-50 73-60 83Z" fill="url(#heart)" transform="translate(0 -2)"/>
      <path d="M103 102l41 25-25 29-42-26z" fill="#fffaf5" stroke="#f0ddd2" strokeWidth="2"/>
      <path d="m105 116 13 8 12-2" fill="none" stroke="#ff8b79" strokeWidth="3"/>
      <path d="M109 130c5-5 10-5 15 0" fill="none" stroke="#ff8b79" strokeWidth="2"/>
      <circle cx="74" cy="76" r="5" fill="#ffb3a4" opacity=".8"/>
    </svg>
  );
}

function ThanksPackage() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <path d="M52 132c14-23 20-47 43-69 11-10 22-10 29 0 9 12-2 29-14 40-15 14-32 23-58 29Z" fill="#d8bd91"/>
      <g fill="#fff">
        <circle cx="83" cy="72" r="16"/><circle cx="108" cy="57" r="17"/><circle cx="126" cy="76" r="15"/><circle cx="103" cy="86" r="16"/><circle cx="67" cy="91" r="13"/>
      </g>
      <g fill="#f5d6a4"><circle cx="83" cy="72" r="3"/><circle cx="108" cy="57" r="3"/><circle cx="126" cy="76" r="3"/><circle cx="103" cy="86" r="3"/><circle cx="67" cy="91" r="3"/></g>
      <path d="M45 103l70 16-15 53-70-17z" fill="#c69d67"/>
      <path d="m45 103 36 8-16 58-35-14z" fill="#b98d58"/>
      <path d="M119 129l45 15-17 28-47-13z" fill="#fffdf8" stroke="#dfd4ca" strokeWidth="2"/>
      <text x="130" y="154" fontSize="9" textAnchor="middle" fill="#9a6c50" fontFamily="serif" transform="rotate(10 130 154)">Thank</text>
      <text x="131" y="165" fontSize="9" textAnchor="middle" fill="#9a6c50" fontFamily="serif" transform="rotate(10 131 165)">you</text>
    </svg>
  );
}

function GraduationPackage() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <g transform="translate(30 38)">
        <path d="M70 16 137 43 70 70 3 43z" fill="#25292e"/>
        <path d="M35 55v35c19 18 51 20 70 0V55L70 69z" fill="#171b20"/>
        <path d="M137 43v39" stroke="#e6a021" strokeWidth="3"/>
        <circle cx="137" cy="85" r="4" fill="#e6a021"/>
        <path d="M50 101c6 7 13 12 20 12s14-5 20-12" fill="none" stroke="#dfd4c8" strokeWidth="3"/>
        <path d="M25 106c13-7 25-5 37 4" fill="none" stroke="#e0d7cf" strokeWidth="3"/>
        <path d="M112 101c-11-6-23-4-34 6" fill="none" stroke="#e0d7cf" strokeWidth="3"/>
      </g>
      <path d="M39 151h108" stroke="#e9ded3" strokeWidth="2"/>
    </svg>
  );
}

function BecausePackage() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <path d="M76 162c11-29 19-61 38-105" fill="none" stroke="#4c7133" strokeWidth="6" strokeLinecap="round"/>
      <path d="M96 103c-25-18-35-13-40-5 17 10 30 10 40 5Zm9-22c18-20 30-18 37-11-12 15-24 18-37 11Zm-18 50c-18-16-30-13-35-5 14 11 25 12 35 5Zm22-20c18-18 29-15 35-8-12 13-23 15-35 8Z" fill="#648d3e"/>
      <g transform="rotate(-8 111 127)">
        <path d="M91 99h63v57H91z" fill="#fffdf8" stroke="#ded2c7" strokeWidth="2"/>
        <path d="M91 99h63l-31 25z" fill="#fff8ee"/>
        <text x="122" y="132" textAnchor="middle" fontSize="10" fill="#845c45" fontFamily="serif">Just</text>
        <text x="122" y="143" textAnchor="middle" fontSize="10" fill="#845c45" fontFamily="serif">Because</text>
        <text x="122" y="151" textAnchor="middle" fontSize="9" fill="#ff6900">♥</text>
      </g>
    </svg>
  );
}

function GiftBundle() {
  return (
    <div className="absolute right-[-1%] top-[6px] h-[215px] w-[510px]">
      <div className="absolute bottom-[12px] right-[3%] h-[76px] w-[400px] rounded-[50%] bg-[#ffd3ae] opacity-55 blur-2xl" />
      <div className="absolute bottom-[28px] right-[8%] h-[110px] w-[155px] rotate-[3deg] rounded-[9px] bg-gradient-to-br from-[#fffefa] to-[#f5ece2] shadow-[0_18px_30px_rgba(110,64,35,.14)]">
        <div className="absolute left-1/2 top-[18px] h-[75px] w-[2px] -translate-x-1/2 bg-[#e9ddd2]" />
        <div className="absolute left-1/2 top-[40px] h-11 w-11 -translate-x-1/2 rounded-full border-2 border-[#ff6900] text-center text-[30px] leading-[37px] text-[#ff6900]">♡</div>
      </div>
      <div className="absolute bottom-[28px] right-[18%] h-[105px] w-[145px] rotate-[-4deg] rounded-[9px] bg-gradient-to-br from-[#ffb46f] to-[#ff7620] shadow-[0_18px_30px_rgba(167,79,21,.18)]">
        <div className="absolute -top-[4px] left-1/2 h-[113px] w-[13px] -translate-x-1/2 bg-[#ff8a2e]" />
        <div className="absolute -top-[28px] left-1/2 h-14 w-24 -translate-x-1/2">
          <div className="absolute left-1/2 top-4 h-7 w-14 -translate-x-[90%] rotate-[-28deg] rounded-full border-[7px] border-[#ff7b20]" />
          <div className="absolute left-1/2 top-4 h-7 w-14 rotate-[28deg] rounded-full border-[7px] border-[#ff7b20]" />
        </div>
      </div>
      <div className="absolute bottom-[26px] right-[34%] h-[113px] w-[152px] rotate-[4deg] rounded-[9px] bg-white shadow-[0_18px_28px_rgba(100,60,30,.15)]">
        <div className="absolute inset-x-0 top-0 h-14 bg-[#fff8f0]" />
        <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff6900] text-center text-[28px] leading-[35px] text-[#ff6900]">♡</div>
      </div>
      <div className="absolute bottom-[27px] right-[43%] h-[120px] w-[90px]">
        <FlowerSprig small />
      </div>
      <div className="absolute bottom-[0] right-[25%] h-[22px] w-[125px] rotate-[17deg] rounded-full border-l-[7px] border-[#ff7920]" />
      <div className="absolute bottom-[42px] right-[2%] h-[17px] w-[115px] rotate-[-22deg] rounded-full border-t-[7px] border-[#ff7920]" />
    </div>
  );
}

function FlowerSprig({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 130 180" className={small ? "h-[120px] w-[88px]" : "h-[190px] w-[135px]"} aria-hidden="true">
      <path d="M54 175C57 130 59 87 78 35" fill="none" stroke="#718c50" strokeWidth="3"/>
      <path d="M57 132C35 113 22 99 14 79M59 112c21-17 33-30 40-51M58 91C40 78 31 65 26 51" fill="none" stroke="#718c50" strokeWidth="2"/>
      <g fill="#779755">
        <ellipse cx="28" cy="100" rx="15" ry="5" transform="rotate(35 28 100)"/><ellipse cx="88" cy="84" rx="15" ry="5" transform="rotate(-32 88 84)"/>
        <ellipse cx="42" cy="73" rx="14" ry="5" transform="rotate(30 42 73)"/><ellipse cx="78" cy="60" rx="14" ry="5" transform="rotate(-32 78 60)"/>
      </g>
      <g fill="#fffdf7">
        <circle cx="15" cy="77" r="6"/><circle cx="27" cy="82" r="5"/><circle cx="101" cy="31" r="6"/><circle cx="90" cy="38" r="5"/><circle cx="78" cy="34" r="5"/>
      </g>
      <g fill="#e9c19c"><circle cx="15" cy="77" r="2"/><circle cx="27" cy="82" r="2"/><circle cx="101" cy="31" r="2"/><circle cx="90" cy="38" r="2"/><circle cx="78" cy="34" r="2"/></g>
    </svg>
  );
}

function MiniBouquet() {
  return (
    <svg viewBox="0 0 180 100" className="absolute bottom-0 left-1/2 h-[105px] w-[170px] -translate-x-1/2" aria-hidden="true">
      <path d="M87 97C88 65 91 41 102 16" stroke="#6c8c52" strokeWidth="3" fill="none"/>
      <path d="M89 70C72 55 63 42 60 28M94 61c18-15 25-26 27-42" stroke="#6c8c52" strokeWidth="2" fill="none"/>
      <g fill="#f07b43"><circle cx="55" cy="32" r="13"/><circle cx="83" cy="20" r="12"/><circle cx="113" cy="30" r="13"/></g>
      <g fill="#f6b25f"><circle cx="55" cy="32" r="4"/><circle cx="83" cy="20" r="4"/><circle cx="113" cy="30" r="4"/></g>
      <path d="M51 54h75l-38 41z" fill="#ead2b8" opacity=".95"/>
      <path d="M51 54c20 9 55 9 75 0" fill="none" stroke="#cfae91" strokeWidth="2"/>
    </svg>
  );
}

function GiftIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M8 20h32v22H8z" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round"/>
      <path d="M6 20h36v-8H6zM24 20v22" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round"/>
      <path d="M24 12c-1.8-7-11.8-9-12.6-3.4C10.5 13.4 18.5 14 24 12Zm0 0c1.8-7 11.8-9 12.6-3.4C37.5 13.4 29.5 14 24 12Z" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowRight() {
  return <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true"><path d="M3 10h13M10.5 5.5 15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function CursorIcon() {
  return <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true"><path d="m13 8 23 18-10 2 5 10-5 3-6-10-7 7V8Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/></svg>;
}

function PenIcon() {
  return <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true"><path d="m10 35 3-9L32 7l8 8-19 19-11 1Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/><path d="m27 12 8 8M13 26l8 8" stroke="currentColor" strokeWidth="2.4"/></svg>;
}

function PaperPlaneIcon() {
  return <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden="true"><path d="m7 23 34-14-13 31-6-13L7 23Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"/><path d="m22 27 19-18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>;
}
