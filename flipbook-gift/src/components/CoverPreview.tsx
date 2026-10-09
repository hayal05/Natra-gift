"use client";
// The cover as it will look, redrawn live as the creator types (task 3.1).
import { useEffect, useRef } from "react";
import { loadFonts, renderPage } from "../lib/pages";
import type { Palette } from "../lib/pages/types";
import { LAYOUTS, bookStyle, fillPages, type Template } from "../templates";

const W = 300, H = 400, DPR = 2;

const DEFAULT_CLASS = "block aspect-[3/4] w-full rounded-xl shadow-lg ring-1 ring-black/5";

export default function CoverPreview({ template, to, from, fontPair, palette, className = DEFAULT_CLASS }: { template: Template; to: string; from: string; fontPair: 0 | 1; palette?: Palette; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    const book = bookStyle(template, fontPair, palette);
    const [cover] = fillPages(template.pages.slice(0, 1), { to: to.trim() || "you", from: from.trim() || "me" });
    loadFonts(book.fonts).then(() => {
      const cv = ref.current, c = cv?.getContext("2d");
      if (!alive || !cv || !c) return;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      renderPage(c, W, H, cover, LAYOUTS[cover.layout], book, new Map(), 0);
    });
    return () => { alive = false; };
  }, [template, to, from, fontPair, palette]);

  return <canvas ref={ref} width={W * DPR} height={H * DPR} className={className} role="img" aria-label={`${template.name} cover`} />;
}
