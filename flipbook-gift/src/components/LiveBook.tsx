"use client";
// The live sample book on the landing page: the real fold engine with a real template (task 2.5),
// dressed as a hardcover book resting on the hero's linen background.
import { useEffect, useRef, useState } from "react";
import { create, type Flipbook } from "../engine";
import { loadFonts, pageDrawFn } from "../lib/pages";
import { LAYOUTS, TEMPLATE_LIST, instantiate } from "../templates";

const NAMES = { to: "Maya", from: "Daniel" };

export default function LiveBook({ initial = "love-story" }: { initial?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const t = TEMPLATE_LIST.find((x) => x.id === initial);
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
  }, [initial]);

  return (
    <div className="w-full">
      <div
        className="relative rounded-[3px_10px_10px_3px] p-[5px] sm:p-[8px]"
        style={{
          background: "linear-gradient(90deg,#e6d8c5 0%,#f9f2e8 9%,#f4ebdd 100%)",
          boxShadow:
            "1px 1px 0 #e7dac7, 2px 2px 0 #e0d1bc, 3px 3px 0 #d9c9b3, 0 30px 46px -14px rgba(92,62,36,.5), 0 8px 16px rgba(92,62,36,.16)",
        }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[4px] w-[3px] rounded bg-black/[.07] sm:left-[7px]" />
        <div className="overflow-hidden rounded-[2px_7px_7px_2px] bg-[#f7eee5]">
          <div ref={host} className="w-full" aria-label="Sample gift book. Drag a page corner to turn the page." />
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-stone-500 sm:text-xs">
        {failed ? "Sample book unavailable." : "Drag a page corner to turn the page."}
      </p>
    </div>
  );
}
