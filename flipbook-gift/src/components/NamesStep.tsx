"use client";
// Step 1 of the create flow: who the gift is for. Same look as the landing page (cream, serif headings, orange pills).
import Link from "next/link";
import { LIMITS, draftPalette, type Draft } from "../lib/draft";
import type { Template } from "../templates";
import CoverPreview from "./CoverPreview";

const SERIF = "'Lora', Georgia, 'Times New Roman', serif";

const field =
  "mt-2 block w-full rounded-2xl border border-[#eadfd3] bg-white px-4 py-3.5 text-[16px] text-[#192a38] shadow-[0_2px_8px_rgba(80,55,35,.04)] " +
  "placeholder:text-[#b9b0a7] focus:border-[#ff6900] focus:outline-none focus:ring-4 focus:ring-[#ff6900]/15";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="NatraGift home">
      <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#ff6900] text-white shadow-[0_8px_20px_rgba(255,105,0,.2)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M4 10h16v10H4zM3 10h18V7H3zM12 7v13" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M12 7C11 2.7 5.8 2.4 5.8 5.3 5.8 7.3 9.3 7.4 12 7Zm0 0c1-4.3 6.2-4.6 6.2-1.7 0 2-3.5 2.1-6.2 1.7Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[24px] font-bold tracking-[-.04em]">Natra<span className="text-[#ff6900]">Gift</span></span>
    </Link>
  );
}

// Page frame shared by the names step and its "not found / loading" states.
export function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="natra-landing min-h-screen bg-[#fbf7f2] text-[#192a38]">
      <header className="mx-auto flex h-[64px] max-w-[1100px] items-center justify-between px-5 sm:h-[76px] sm:px-8">
        <Logo />
        <Link href="/" className="text-[13px] font-semibold text-[#77706a] hover:text-[#ff6900]">← Back</Link>
      </header>
      <div className={"mx-auto px-5 pb-14 pt-2 sm:px-8 " + (wide ? "max-w-[1100px]" : "max-w-xl text-center")}>{children}</div>
    </main>
  );
}

function Stepper() {
  const steps = ["Names", "Pages", "Send"];
  return (
    <ol className="flex items-center gap-2 text-[12px] font-semibold" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2" aria-current={i === 0 ? "step" : undefined}>
          <span className={"grid h-6 w-6 place-items-center rounded-full text-[11px] " + (i === 0 ? "bg-[#ff6900] text-white" : "bg-[#efe6dc] text-[#9a9087]")}>{i + 1}</span>
          <span className={i === 0 ? "text-[#192a38]" : "text-[#9a9087]"}>{s}</span>
          {i < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-5 bg-[#e4d8cb]" />}
        </li>
      ))}
    </ol>
  );
}

export default function NamesStep({ template, draft, suggested, saveFailed, set, onContinue }: {
  template: Template;
  draft: Draft;
  suggested: string;
  saveFailed: boolean;
  set: (patch: Partial<Draft>) => void;
  onContinue: () => void;
}) {
  const message = draft.invitation ?? suggested;
  return (
    <Shell wide>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-14 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Live cover, on linen. Shown first on phones, to the right on larger screens. */}
        <div className="md:order-2 md:sticky md:top-6">
          <div
            className="relative overflow-hidden rounded-[28px] px-[16%] py-8 sm:py-10"
            style={{ background: "radial-gradient(70% 60% at 80% 20%, rgba(255,255,255,.6), transparent 60%), linear-gradient(160deg,#f4e8d9,#ecdac4 60%,#f2e4d2)" }}
          >
            <div
              className="relative mx-auto max-w-[240px] rounded-[3px_10px_10px_3px] p-[6px] md:max-w-[260px]"
              style={{
                background: "linear-gradient(90deg,#e6d8c5 0%,#f9f2e8 9%,#f4ebdd 100%)",
                boxShadow: "1px 1px 0 #e7dac7, 2px 2px 0 #e0d1bc, 3px 3px 0 #d9c9b3, 0 30px 46px -14px rgba(92,62,36,.5), 0 8px 16px rgba(92,62,36,.16)",
              }}
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[5px] w-[3px] rounded bg-black/[.07]" />
              <CoverPreview
                template={template}
                to={draft.to}
                from={draft.from}
                fontPair={draft.fontPair}
                palette={draftPalette(draft)}
                className="block aspect-[3/4] w-full rounded-[2px_7px_7px_2px]"
              />
            </div>
          </div>
          <p className="mt-3 text-center text-[13px] text-[#8b8279]">Your cover updates as you type</p>
        </div>

        <div className="md:order-1">
          <Stepper />
          <p className="mt-7 text-[12px] font-semibold uppercase tracking-[.2em] text-[#ff6900]">{template.name}</p>
          <h1 className="mt-2 text-[clamp(1.9rem,6vw,2.7rem)] font-bold leading-[1.05] tracking-[-.035em]" style={{ fontFamily: SERIF }}>
            Who is this gift for?
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#77706a]">
            Two names are all you need. Everything else is already written, and you can change it later.
          </p>

          <div className="mt-8 space-y-5">
            <label className="block text-[13px] font-semibold text-[#2c3a47]">
              Their name
              <input className={field} value={draft.to} maxLength={LIMITS.name} autoComplete="off" placeholder="Maya" onChange={(e) => set({ to: e.target.value })} />
            </label>
            <label className="block text-[13px] font-semibold text-[#2c3a47]">
              Your name
              <input className={field} value={draft.from} maxLength={LIMITS.name} autoComplete="name" placeholder="Daniel" onChange={(e) => set({ from: e.target.value })} />
            </label>

            <div className="rounded-3xl border border-[#eadfd3] bg-white p-4 shadow-[0_2px_8px_rgba(80,55,35,.04)]">
              <label htmlFor="inv" className="flex items-center gap-2 text-[13px] font-semibold text-[#2c3a47]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#ff6900]" fill="none" aria-hidden="true">
                  <path d="M3 6h18v12H3zM3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                Message on the envelope
              </label>
              <textarea
                id="inv"
                rows={3}
                maxLength={LIMITS.invitation}
                value={message}
                onChange={(e) => set({ invitation: e.target.value })}
                className="mt-3 block w-full resize-none rounded-2xl border border-[#f1e8df] bg-[#fffaf5] px-4 py-3 text-[15px] leading-relaxed text-[#192a38] focus:border-[#ff6900] focus:outline-none focus:ring-4 focus:ring-[#ff6900]/15"
              />
              <div className="mt-2 flex items-center justify-between text-[12px] text-[#8b8279]">
                <span>{message.length} / {LIMITS.invitation}</span>
                {draft.invitation !== null && (
                  <button type="button" className="font-semibold text-[#ff6900] hover:underline" onClick={() => set({ invitation: null })}>Use the suggested message</button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#ff6900] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(255,105,0,.22)] transition hover:-translate-y-0.5 hover:bg-[#f25e00] sm:w-auto sm:px-10"
          >
            Continue to the pages <span aria-hidden="true" className="text-lg leading-none">→</span>
          </button>

          <p className="mt-5 text-[13px] text-[#8b8279]" role="status">
            {saveFailed ? "Your browser would not save this draft, so it will be lost if you close the page." : "Draft saved on this device."}
          </p>
          <p className="mt-3 text-[14px]"><Link href="/#templates" className="font-semibold text-[#2c3a47] underline decoration-[#ff6900]/50 underline-offset-4 hover:text-[#ff6900]">Choose a different template</Link></p>
        </div>
      </div>
    </Shell>
  );
}
