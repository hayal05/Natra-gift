// Waits for a theme's web fonts before canvas drawing (task 2.5). A canvas does not trigger font downloads
// by itself and draws in the fallback face if the font is not ready, so every page that draws a book calls this first.
import type { FontPair } from "./types";

const WEIGHTS = [400, 600, 700, 800, 900];

const family = (css: string) => css.split(",")[0].trim();

/** Resolves once the display and body faces (the weights the layouts use, plus italic) are loaded. Never rejects. */
export async function loadFonts(fonts: FontPair): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const jobs: Promise<unknown>[] = [];
  for (const role of ["display", "body"] as const) {
    const f = family(fonts[role]);
    for (const w of WEIGHTS) jobs.push(document.fonts.load(`${w} 20px ${f}`, "Aa"));
    jobs.push(document.fonts.load(`italic 400 20px ${f}`, "Aa"));
  }
  await Promise.all(jobs.map((j) => j.catch(() => undefined)));
}
