"use client";
// Preview (task 3.9): the creator's draft in the real fold engine, exactly as the book will fold for the recipient.
import { useEffect, useMemo, useRef, useState } from "react";
import { create, type Flipbook } from "../engine";
import { loadFonts, loadImages, pageDrawFn, type PageData, type Palette } from "../lib/pages";
import { LAYOUTS, bookStyle, fillPages, type Template } from "../templates";

interface Props { template: Template; pages: PageData[]; to: string; from: string; fontPair: 0 | 1; palette?: Palette }

export default function PreviewBook({ template, pages, to, from, fontPair, palette }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const book = useMemo(() => bookStyle(template, fontPair, palette), [template, fontPair, palette]);
  const filled = useMemo(() => fillPages(pages, { to: to.trim() || "you", from: from.trim() || "me" }), [pages, to, from]);

  useEffect(() => {
    if (!host.current) return;
    setFailed(false);
    // Photos that fail to load draw as a placeholder instead of stopping the whole book.
    const ready = Promise.all([loadFonts(book.fonts), loadImages(filled)]).then(([, images]) => filled.map((p) => pageDrawFn(p, LAYOUTS, book, images)));
    let fb: Flipbook | undefined = create(host.current, {
      pages: filled.map((_, i) => ready.then((fns) => fns[i])),
      loadingText: "Opening the book…",
      errorText: "The preview could not be drawn.",
      onError: () => setFailed(true),
    });
    return () => { fb?.destroy(); fb = undefined; };
  }, [book, filled]);

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div ref={host} className="w-full" aria-label="Preview of your gift book. Drag a page corner to turn the page." />
      <p className="mt-4 text-center text-sm text-stone-500">{failed ? "The preview is unavailable." : "This is how it folds for them. Drag a page corner to turn the page."}</p>
    </div>
  );
}
