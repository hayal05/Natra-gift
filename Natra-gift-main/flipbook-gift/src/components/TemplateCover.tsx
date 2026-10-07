"use client";
// A template's real cover, drawn by the page renderer, for the template cards (task 2.5).
import { useEffect, useRef } from "react";
import { loadFonts, renderPage } from "../lib/pages";
import { LAYOUTS, instantiate, type Template } from "../templates";

const W = 300, H = 400, DPR = 2;

export default function TemplateCover({ template }: { template: Template }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    const { book, pages } = instantiate(template, { to: "Maya", from: "Daniel" });
    loadFonts(book.fonts).then(() => {
      const cv = ref.current;
      const c = cv?.getContext("2d");
      if (!alive || !cv || !c) return;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      renderPage(c, W, H, pages[0], LAYOUTS[pages[0].layout], book, new Map(), 0);
    });
    return () => { alive = false; };
  }, [template]);

  return <canvas ref={ref} width={W * DPR} height={H * DPR} className="block aspect-[3/4] w-full" role="img" aria-label={`${template.name} cover`} />;
}
