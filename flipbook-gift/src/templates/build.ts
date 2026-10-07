// Turns a template into a book the renderer and the editor can use, with the creator's names filled in.
import type { BookStyle, PageData, Palette, PhotoContent } from "../lib/pages/types";
import type { Names, Template } from "./types";

/** Replaces {to} and {from}. */
export const fill = (s: string, n: Names) => s.replaceAll("{to}", n.to).replaceAll("{from}", n.from);

/** Deep copy of pages with {to}/{from} replaced in every text slot. Text the creator typed has no tokens and stays as is. */
export function fillPages(pages: PageData[], names: Names): PageData[] {
  return pages.map((p): PageData => ({
    ...p,
    slots: Object.fromEntries(Object.entries(p.slots).map(([k, v]) =>
      [k, typeof v === "string" ? fill(v, names) : ({ ...v } as PhotoContent)])),
    styles: p.styles ? structuredClone(p.styles) : undefined,
  }));
}

/** `palette` replaces the template's own colours (book style presets, task 3.7). */
export function bookStyle(t: Template, fontPair: 0 | 1 = 0, palette?: Palette): BookStyle {
  return { palette: { ...(palette ?? t.palette) }, fonts: { ...t.fontPairs[fontPair] }, masthead: t.masthead };
}

export function instantiate(t: Template, names: Names, fontPair: 0 | 1 = 0): { book: BookStyle; pages: PageData[]; invitation: string } {
  return { book: bookStyle(t, fontPair), pages: fillPages(t.pages, names), invitation: fill(t.invitation, names) };
}
