import LiveBook from "../components/LiveBook";
import TemplateGrid from "../components/TemplateGrid";

const STEPS = [
  { n: "1", title: "Pick a template", text: "Ten finished digital magazines, each with its own look and warm sample words. Nothing to design." },
  { n: "2", title: "Make it yours", text: "Add your names and swap in your photos. Tweak the words, fonts and colours if you like, or leave it as it is." },
  { n: "3", title: "Send one link", text: "They open an envelope, then turn the pages with a finger like real paper. You can also download a copy that works offline." },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 md:grid-cols-2 md:gap-12 md:pb-20 md:pt-16">
        <div className="text-center md:text-left">
          <p className="text-sm font-bold uppercase tracking-widest text-rose-700">A gift that opens like a letter</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-stone-900 sm:text-5xl">
            Turn your photos and words into a book they can hold.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600 md:mx-0">
            Choose a template, add your memories, and send a link. Your person gets an envelope to open, then a magazine
            whose pages fold under their finger.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
            <a href="#templates" className="rounded-full bg-rose-700 px-7 py-3 text-base font-bold text-white shadow-md transition hover:bg-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2">
              Choose a template
            </a>
            <span className="text-sm text-stone-500">No sign-up needed</span>
          </div>
        </div>
        <div><LiveBook /></div>
      </section>

      <section className="bg-white py-14 md:py-20" aria-labelledby="how">
        <div className="mx-auto max-w-6xl px-5">
          <h2 id="how" className="text-center font-display text-3xl font-bold text-stone-900">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 font-display text-xl font-bold text-rose-800" aria-hidden="true">{s.n}</span>
                <h3 className="mt-4 text-lg font-bold text-stone-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-stone-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-14 md:py-20" aria-labelledby="tpl">
        <h2 id="tpl" className="text-center font-display text-3xl font-bold text-stone-900">Pick the one that feels like them</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-stone-600">Every template arrives finished. You only need two names to start.</p>
        <div className="mt-10"><TemplateGrid /></div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">Made with care for the people who matter.</footer>
    </main>
  );
}
