// The owner-supplied fonts attached to the app (task 11.3). Pure data with NO imports, because
// scripts/build-offline.mjs reads this same file to put the fonts into the offline export.
// To add a font: put its .woff2 files in public/fonts/ (made by scripts/compress-fonts.py), add a line below and its
// @font-face lines in src/app/custom-fonts.css (scripts/test-fontlist.ts checks that they agree). See README, "Custom fonts".
export interface CustomFont {
  /** Registry id stored in gifts. Never rename one that has shipped. */
  id: string;
  /** Name shown in the picker (may include the name in Ethiopic script). */
  label: string;
  /** CSS family name (ASCII). */
  family: string;
  category: "Serif" | "Sans" | "Display" | "Ethiopic";
  /** The one real weight of the file. Set it right: a missing bold is faked wider than it is measured and clips text. */
  weight: number;
  /** File inside public/fonts/ (versioned: change the name when the font changes). */
  file: string;
  /** Tiny subset with only the letters of the label, for the picker row. Missing for fonts without Latin letters. */
  nameFile?: string;
  /** What the font's own file says about embedding (NOT legal advice): ok = open licence, ask = unclear or permission needed, no = the file forbids embedding. */
  licence: "ok" | "ask" | "no";
}

export const CUSTOM_FONTS: readonly CustomFont[] = [
  { id: "agbalumo", label: "Agbalumo", family: "Agbalumo", category: "Display", weight: 400, file: "agbalumo.v1.woff2", nameFile: "agbalumo-name.v1.woff2", licence: "ok" },
  { id: "nokia-light", label: "Nokia Light ኖኪያ", family: "Nokia Light", category: "Ethiopic", weight: 200, file: "nokia-light.v1.woff2", nameFile: "nokia-light-name.v1.woff2", licence: "ask" },
  { id: "nokia-bold", label: "Nokia Bold ኖኪያ", family: "Nokia Bold", category: "Ethiopic", weight: 700, file: "nokia-bold.v1.woff2", nameFile: "nokia-bold-name.v1.woff2", licence: "ask" },
  { id: "goffer", label: "Goffer ጎፈር", family: "Goffer", category: "Ethiopic", weight: 400, file: "goffer.v1.woff2", nameFile: "goffer-name.v1.woff2", licence: "ask" },
  { id: "zemenay", label: "Zemenay", family: "Zemenay", category: "Ethiopic", weight: 400, file: "zemenay.v1.woff2", nameFile: "zemenay-name.v1.woff2", licence: "ask" },
  { id: "kiros", label: "Kiros ኪሮስ", family: "Kiros", category: "Ethiopic", weight: 400, file: "kiros.v1.woff2", nameFile: "kiros-name.v1.woff2", licence: "no" },
  { id: "surgraphics", label: "SurGraphics", family: "SurGraphics", category: "Ethiopic", weight: 900, file: "surgraphics.v1.woff2", nameFile: "surgraphics-name.v1.woff2", licence: "no" },
  { id: "loga", label: "Loga", family: "Loga", category: "Ethiopic", weight: 400, file: "loga.v1.woff2", licence: "ask" },
  { id: "loga-medium", label: "Loga Medium", family: "Loga Medium", category: "Ethiopic", weight: 500, file: "loga-medium.v1.woff2", licence: "ask" },
  { id: "loga-light", label: "Loga Light", family: "Loga Light", category: "Ethiopic", weight: 300, file: "loga-light.v1.woff2", licence: "ask" },
  { id: "loga-thin", label: "Loga Thin", family: "Loga Thin", category: "Ethiopic", weight: 100, file: "loga-thin.v1.woff2", licence: "ask" },
  { id: "dire-dawa", label: "Dire Dawa ድሬዳዋ", family: "Dire Dawa", category: "Ethiopic", weight: 400, file: "dire-dawa.v1.woff2", nameFile: "dire-dawa-name.v1.woff2", licence: "ask" },
  { id: "chiret", label: "Chiret ጭረት", family: "Chiret", category: "Ethiopic", weight: 400, file: "chiret.v1.woff2", nameFile: "chiret-name.v1.woff2", licence: "no" },
  { id: "shiromeda", label: "Shiromeda ሽሮሜዳ", family: "Shiromeda", category: "Ethiopic", weight: 400, file: "shiromeda.v1.woff2", nameFile: "shiromeda-name.v1.woff2", licence: "no" },
  { id: "shiromeda-bold", label: "Shiromeda Bold ሽሮሜዳ", family: "Shiromeda Bold", category: "Ethiopic", weight: 700, file: "shiromeda-bold.v1.woff2", nameFile: "shiromeda-bold-name.v1.woff2", licence: "no" },
  { id: "benaiah", label: "Benaiah", family: "Benaiah", category: "Ethiopic", weight: 700, file: "benaiah.v1.woff2", nameFile: "benaiah-name.v1.woff2", licence: "ask" },
  { id: "yebse", label: "Yebse የብስ", family: "Yebse", category: "Ethiopic", weight: 400, file: "yebse.v1.woff2", nameFile: "yebse-name.v1.woff2", licence: "ask" },
  { id: "wahsrab", label: "Wahsrab ዋሽራብ", family: "Wahsrab", category: "Ethiopic", weight: 700, file: "wahsrab.v1.woff2", nameFile: "wahsrab-name.v1.woff2", licence: "ask" },
  { id: "abinet", label: "Abinet አብነት", family: "Abinet", category: "Ethiopic", weight: 700, file: "abinet.v1.woff2", nameFile: "abinet-name.v1.woff2", licence: "no" },
  { id: "addis", label: "Addis አዲስ", family: "Addis", category: "Ethiopic", weight: 400, file: "addis.v1.woff2", nameFile: "addis-name.v1.woff2", licence: "ask" },
  { id: "meaza", label: "Meaza መዓዛ", family: "Meaza", category: "Ethiopic", weight: 400, file: "meaza.v1.woff2", nameFile: "meaza-name.v1.woff2", licence: "no" },
  { id: "adwa-sans", label: "Adwa Sans አድዋ", family: "Adwa Sans", category: "Ethiopic", weight: 400, file: "adwa-sans.v1.woff2", nameFile: "adwa-sans-name.v1.woff2", licence: "no" },
  { id: "adwa-sans-bold", label: "Adwa Sans Bold አድዋ", family: "Adwa Sans Bold", category: "Ethiopic", weight: 700, file: "adwa-sans-bold.v1.woff2", nameFile: "adwa-sans-bold-name.v1.woff2", licence: "no" },
  { id: "adwa", label: "Adwa አድዋ", family: "Adwa", category: "Ethiopic", weight: 400, file: "adwa.v1.woff2", nameFile: "adwa-name.v1.woff2", licence: "no" },
  { id: "adwa-bold", label: "Adwa Bold አድዋ", family: "Adwa Bold", category: "Ethiopic", weight: 700, file: "adwa-bold.v1.woff2", nameFile: "adwa-bold-name.v1.woff2", licence: "no" },
  { id: "astra", label: "ASTRA", family: "ASTRA", category: "Ethiopic", weight: 400, file: "astra.v1.woff2", nameFile: "astra-name.v1.woff2", licence: "ask" },
];
