import type { FontPair, PageData, Palette } from "../lib/pages/types";

/** A finished template: theme + sample pages. Text may contain {to} and {from}, filled in by instantiate(). */
export interface Template {
  id: string;
  name: string;
  /** One line for the template card on the landing page. */
  blurb: string;
  /** Shown in the footer of every page and as the cover masthead idea, e.g. "OUR STORY". */
  masthead: string;
  palette: Palette;
  /** Two font pairs; the creator picks one in the book style presets (task 3.7). Index 0 is the default. */
  fontPairs: [FontPair, FontPair];
  /** Default envelope message (task 3.1). */
  invitation: string;
  /** Page 0 is the cover. Sample photos use src "sample:1" to "sample:6" (task 2.4 draws them). */
  pages: PageData[];
}

export interface Names {
  to: string;
  from: string;
}
