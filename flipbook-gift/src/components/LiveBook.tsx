"use client";
// The live sample book on the landing page: the real fold engine with a real template (task 2.5).
import { useEffect, useRef, useState } from "react";
import { create, type Flipbook } from "../engine";
import { loadFonts, pageDrawFn } from "../lib/pages";
import { LAYOUTS, TEMPLATE_LIST, instantiate } from "../templates";

const NAMES = { to: "Maya", from: "Daniel" };

export default function LiveBook({ initial = "love-story" }: { initial?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [id, setId] = useState(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const t = TEMPLATE_LIST.find((x) => x.id === id);
    if (!t || !host.current) return;
    const { book, pages } = instantiate(t, NAMES);
    const images = new Map();
    const ready = loadFonts(book.fonts).then(() => pages.map((p) => pageDrawFn(p, LAYOUTS, book, images)));
    let fb: Flipbook | undefined = create(host.current, {
      pages: pages.map((_, i) => ready.then((fns) => fns[i])),
      loadingText: "Opening the book…",
      errorText: "The book could not be drawn.",
      onError: () => setFailed(true),
    });
    setFailed(false);
    return () => { fb?.destroy(); fb = undefined; };
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div ref={host} className="w-full" aria-label="Sample gift book. Drag a page corner to turn the page." />
      <p className="mt-4 text-center text-sm text-stone-500">
        {failed ? "Sample book unavailable." : "Drag a page corner to turn the page."}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Try another template">
        {TEMPLATE_LIST.map((t) => (
          <button key={t.id} type="button" onClick={() => setId(t.id)} aria-pressed={t.id === id}
            className={"rounded-full border px-3 py-1 text-xs font-semibold transition " +
              (t.id === id ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500")}>
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
