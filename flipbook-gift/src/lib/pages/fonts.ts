// Waits for a theme's web fonts before canvas drawing (task 2.5). A canvas does not trigger font downloads
// by itself and draws in the fallback face if the font is not ready, so every page that draws a book calls this first.
import { fontById } from "./fontlist";
import type { FontPair, PageData } from "./types";

const WEIGHTS = [400, 600, 700, 800, 900];

const family = (css: string) => css.split(",")[0].trim();

/** Registry ids the pages actually use (picked on a text style or set on an added text box), in first-use order. Unknown ids are left out. */
export function usedFontIds(pages: readonly PageData[] = []): string[] {
  const ids = new Set<string>();
  for (const p of pages) {
    for (const st of Object.values(p.styles ?? {})) if (fontById(st?.family)) ids.add(st.family!);
    for (const x of p.extras ?? []) if (x.kind === "text" && fontById(x.family)) ids.add(x.family!);
  }
  return [...ids];
}

/**
 * Resolves once the display and body faces (the weights the layouts use, plus italic) are loaded, and every extra
 * family the given pages use (only the weights that family really has). Never rejects.
 */
export async function loadFonts(fonts: FontPair, pages?: readonly PageData[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const jobs: Promise<unknown>[] = [];
  for (const role of ["display", "body"] as const) {
    const f = family(fonts[role]);
    for (const w of WEIGHTS) jobs.push(document.fonts.load(`${w} 20px ${f}`, "Aa"));
    jobs.push(document.fonts.load(`italic 400 20px ${f}`, "Aa"));
  }
  for (const id of usedFontIds(pages)) {
    const e = fontById(id)!;
    const f = `'${e.family}'`;
    for (const w of e.weights) jobs.push(document.fonts.load(`${w} 20px ${f}`, "Aa"));
    if (e.italic) jobs.push(document.fonts.load(`italic 400 20px ${f}`, "Aa"));
  }
  await Promise.all(jobs.map((j) => j.catch(() => undefined)));
}
