import Link from "next/link";
import LiveBook from "../components/LiveBook";
import { TEMPLATE_LIST } from "../templates";

const FEATURED = ["love-story", "birthday", "anniversary", "best-friends", "just-because"];

export default function Home() {
  const templates = FEATURED.map((id) => TEMPLATE_LIST.find((t) => t.id === id)).filter(Boolean);

  return (
    <main className="min-h-[100svh] overflow-hidden">
      <header className="relative z-10 mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="NatraGift home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-900 text-lg text-white shadow-sm">♡</span>
          <span className="font-display text-xl font-bold tracking-tight text-stone-900">NatraGift</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <a href="#how" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-white hover:text-stone-900 sm:inline-flex">
            How it works
          </a>
          <a href="#templates" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            Create a Gift
          </a>
        </nav>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-center px-5 pb-8 pt-2 sm:px-8">
        <div className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-amber-100/70 blur-3xl" />

        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-rose-700 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              A little something special
            </div>

            <h1 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.4rem)] font-bold leading-[0.92] tracking-[-0.045em] text-stone-950">
              Make someone&apos;s
              <span className="block text-rose-700">day. <span className="font-sans text-[0.68em]">♥</span></span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-stone-600 sm:text-lg">
              Create a beautiful digital gift that opens like a letter — filled with your words, photos, and memories.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#templates" className="group inline-flex items-center gap-3 rounded-full bg-rose-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition hover:-translate-y-0.5 hover:bg-rose-800">
                Create a Gift
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <span className="text-sm font-medium text-stone-500">No sign-up needed</span>
            </div>

            <div id="how" className="mt-9 flex max-w-md items-center gap-4 border-t border-stone-200/80 pt-5">
              <Step n="01" title="Choose" />
              <span className="h-px flex-1 bg-stone-200" />
              <Step n="02" title="Personalize" />
              <span className="h-px flex-1 bg-stone-200" />
              <Step n="03" title="Send" />
            </div>
          </div>

          <div className="relative z-10 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[410px] rounded-[2rem] border border-white/80 bg-white/45 p-4 shadow-[0_30px_80px_rgba(80,30,40,0.12)] backdrop-blur-sm sm:p-6">
              <div className="absolute -right-3 -top-3 grid h-12 w-12 rotate-6 place-items-center rounded-2xl bg-white text-xl shadow-lg ring-1 ring-stone-100">✦</div>
              <div className="rounded-[1.5rem] bg-[#fffaf7] px-3 py-4 sm:px-5">
                <LiveBook />
              </div>
              <p className="mt-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
                Open · turn · treasure
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-stone-200/80 bg-white/75 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Start with a feeling</p>
            <p className="mt-1 text-sm font-semibold text-stone-800">Pick a ready-made gift and make it yours.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => t && (
              <Link
                key={t.id}
                href={`/create?t=${t.id}`}
                className="rounded-full border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="font-mono text-[10px] font-bold text-rose-600">{n}</span>
      <span className="text-xs font-bold text-stone-700">{title}</span>
    </div>
  );
}
