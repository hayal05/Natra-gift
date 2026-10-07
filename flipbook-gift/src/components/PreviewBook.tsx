"use client";
// Preview (task 3.9): the creator's draft in the real fold engine, exactly as the book will fold for the recipient.
import { useEffect, useMemo, useRef, useState } from "react";
import { create, type Flipbook } from "../engine";
import { createAudioPlayer, createPageLayer } from "../audio";
import { loadFonts, loadImages, pageDrawFn, type PageData, type Palette } from "../lib/pages";
import { LAYOUTS, bookStyle, fillPages, type Template } from "../templates";

interface Props { template: Template; pages: PageData[]; to: string; from: string; fontPair: 0 | 1; palette?: Palette }

export default function PreviewBook({ template, pages, to, from, fontPair, palette }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const book = useMemo(() => bookStyle(template, fontPair, palette), [template, fontPair, palette]);
  const filled = useMemo(() => fillPages(pages, { to: to.trim() || "you", from: from.trim() || "me" }), [pages, to, from]);

  useEffect(() => {
    if (!host.current || !frame.current) return;
    setFailed(false);
    // Photos that fail to load draw as a placeholder instead of stopping the whole book.
    const ready = Promise.all([loadFonts(book.fonts), loadImages(filled)]).then(([, images]) => filled.map((p) => pageDrawFn(p, LAYOUTS, book, images)));
    // Voice notes (task 8.4): the same player and rules as the recipient page, so the creator hears what they will hear.
    // `pages` and `filled` have the same order; the note shows only while the current page owns one.
    let layer: ReturnType<typeof createPageLayer> | undefined = createPageLayer(frame.current);
    let player: ReturnType<typeof createAudioPlayer> | undefined = createAudioPlayer(layer.el);
    player.show(pages[0]?.audio ?? null);
    let fb: Flipbook | undefined = create(host.current, {
      pages: filled.map((_, i) => ready.then((fns) => fns[i])),
      loadingText: "Opening the book…",
      errorText: "The preview could not be drawn.",
      onError: () => setFailed(true),
      onPageChange: (i) => player?.show(pages[i]?.audio ?? null),
      onLayout: (r) => layer?.setRect(r),
    });
    return () => { player?.destroy(); player = undefined; layer?.destroy(); layer = undefined; fb?.destroy(); fb = undefined; };
  }, [book, filled, pages]);

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div ref={frame} className="relative">
        <div ref={host} className="w-full" aria-label="Preview of your gift book. Drag a page corner to turn the page." />
      </div>
      <p className="mt-4 text-center text-sm text-stone-500">{failed ? "The preview is unavailable." : "This is how it folds for them. Drag a page corner to turn the page."}</p>
    </div>
  );
}
